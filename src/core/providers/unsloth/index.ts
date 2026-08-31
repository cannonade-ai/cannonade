import { ProviderError, type LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/provider/ipc-contracts'
import { authHeader } from '@shared/provider/api-key'
import type {
  UnslothChatResponse,
  UnslothDownloadJobStatus,
  UnslothDownloadProgress,
  UnslothDownloadStartResponse,
  UnslothInferenceStatus,
  UnslothModelsResponse
} from './types'
import {
  isModelLoaded,
  toChatRequest,
  toChatResponse,
  toDownloadStatus,
  toLocalModels,
  toModelSelector,
  toProviderError,
  toRepoId
} from './mappers'
import {
  isManagedProcess,
  startManagedProcess,
  stopManagedProcess
} from '../../../main/services/managed-process'
import { createLogger } from '../../../main/logger'

const log = createLogger('unsloth')

const DOWNLOAD_POLL_INTERVAL_MS = 1000
const DOWNLOAD_TIMEOUT_MS = 6 * 60 * 60 * 1000
const PROBE_INTERVAL_MS = 500
const START_TIMEOUT_MS = 60000
const STOP_TIMEOUT_MS = 15000
const UNSLOTH_EXECUTABLE = 'unsloth'

interface DownloadJob {
  repoId: string
  variant?: string
}

export function createUnslothProvider(
  instanceId: string,
  url: string,
  apiKey?: string,
  remote = false
): LLMProvider {
  const base = url.replace(/(\/v1)?\/?$/, '')
  const auth = authHeader(apiKey)
  const downloadJobs = new Map<string, DownloadStatusResponse>()

  async function send(path: string, init?: RequestInit): Promise<Response> {
    log.debug(`sending request to ${base}${path}`)
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...auth, ...init?.headers }
    })
    if (!res.ok) {
      const body = await res.json().catch(() => undefined)
      throw toProviderError(res.status, res.statusText, body)
    }
    return res
  }

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await send(path, init)
    return (await res.json()) as T
  }

  async function fetchInferenceStatus(): Promise<UnslothInferenceStatus> {
    return requestJson<UnslothInferenceStatus>('/api/inference/status')
  }

  async function fetchLocalModels(): Promise<LocalModel[]> {
    const data = await requestJson<UnslothModelsResponse>('/v1/models')
    const status = await fetchInferenceStatus().catch((e) => {
      log.debug('Could not read inference status for model capabilities:', e)
      return undefined
    })
    return toLocalModels(data.data, instanceId, status)
  }

  async function probeApiKey(): Promise<void> {
    await send('/v1/models')
  }

  async function chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
    const body = toChatRequest(request)
    log.debug('Chat request body:', body)
    const response = await requestJson<UnslothChatResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: options?.abortSignal
    })
    return toChatResponse(response)
  }

  async function loadModel(modelId: string): Promise<void> {
    const { repoId, variant } = toModelSelector(modelId)
    log.info(`Loading model "${repoId}"${variant ? ` (${variant})` : ''}`)
    await send('/api/inference/load', {
      method: 'POST',
      body: JSON.stringify({ model_path: repoId, gguf_variant: variant })
    })
  }

  async function unloadModel(loadedInstanceId: string): Promise<void> {
    const { repoId } = toModelSelector(loadedInstanceId)
    log.info(`Unloading model "${repoId}"`)
    await send('/api/inference/unload', {
      method: 'POST',
      body: JSON.stringify({ model_path: repoId, force_cancel_active: true })
    })
  }

  async function deleteModel(modelId: string): Promise<void> {
    const { repoId, variant } = toModelSelector(modelId)
    const status = await fetchInferenceStatus()
    if (isModelLoaded(status, modelId)) {
      log.debug(`Model "${repoId}" is loaded, unloading it before delete`)
      await unloadModel(modelId)
    }
    await send('/api/hub/delete-cached', {
      method: 'DELETE',
      body: JSON.stringify({ repo_id: repoId, variant })
    })
  }

  function toProgressPath(job: DownloadJob): string {
    if (job.variant) {
      const params = new URLSearchParams({ repo_id: job.repoId, variant: job.variant })
      return `/api/hub/gguf-download-progress?${params}`
    }
    return `/api/hub/download-progress?${new URLSearchParams({ repo_id: job.repoId })}`
  }

  async function pollDownload(jobId: string, job: DownloadJob, startedAt: string): Promise<void> {
    const statusParams = new URLSearchParams({ repo_id: job.repoId })
    if (job.variant) statusParams.set('gguf_variant', job.variant)
    const statusPath = `/api/hub/download-status?${statusParams}`
    const progressPath = toProgressPath(job)
    const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS

    while (Date.now() < deadline) {
      await new Promise<void>((resolve) => setTimeout(resolve, DOWNLOAD_POLL_INTERVAL_MS))
      try {
        const [status, progress] = await Promise.all([
          requestJson<UnslothDownloadJobStatus>(statusPath),
          requestJson<UnslothDownloadProgress>(progressPath).catch((err) => {
            log.debug(`Download progress unavailable for "${job.repoId}":`, err)
            return undefined
          })
        ])
        log.silly(`Download poll for "${job.repoId}":`, status, progress)
        const mapped = toDownloadStatus(jobId, status, progress, startedAt)
        downloadJobs.set(jobId, mapped)
        if (mapped.status === 'completed') {
          log.info(`Download of "${job.repoId}" completed`)
          return
        }
        if (mapped.status === 'failed') {
          log.error(`Download of "${job.repoId}" failed:`, status.error)
          return
        }
      } catch (err) {
        log.error(`Download status poll failed for "${job.repoId}":`, err)
        downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
        return
      }
    }

    log.error(`Download of "${job.repoId}" timed out`)
    downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
  }

  async function downloadModel(
    downloadTarget: string,
    quantization?: string
  ): Promise<DownloadModelResponse> {
    const repoId = toRepoId(downloadTarget)
    log.info(`Download target "${downloadTarget}" resolved to repo "${repoId}"`)
    const jobId = crypto.randomUUID()
    const startedAt = new Date().toISOString()
    const job: DownloadJob = { repoId, variant: quantization }

    const started = await requestJson<UnslothDownloadStartResponse>('/api/hub/download', {
      method: 'POST',
      body: JSON.stringify({ repo_id: repoId, gguf_variant: quantization, transport_mode: 'auto' })
    })
    log.debug(`Download start response for "${repoId}":`, started)

    const progress = await requestJson<UnslothDownloadProgress>(toProgressPath(job)).catch(
      () => undefined
    )
    if (progress?.complete_on_disk) {
      log.info(`"${repoId}" is already downloaded`)
      return {
        job_id: jobId,
        status: 'already_downloaded',
        total_size_bytes: progress.expected_bytes
      }
    }

    downloadJobs.set(jobId, {
      job_id: jobId,
      status: 'downloading',
      started_at: startedAt,
      total_size_bytes: progress?.expected_bytes || undefined
    })
    void pollDownload(jobId, job, startedAt)

    return {
      job_id: jobId,
      status: 'downloading',
      started_at: startedAt,
      total_size_bytes: progress?.expected_bytes || undefined
    }
  }

  async function getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> {
    return downloadJobs.get(jobId) ?? { job_id: jobId, status: 'failed' }
  }

  async function isServerReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${base}/api/health`)
      return res.ok
    } catch (err) {
      log.debug(`Server is not reachable for ${url}:`, err)
      return false
    }
  }

  async function waitForReachable(expected: boolean, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if ((await isServerReachable()) === expected) return true
      await new Promise<void>((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS))
    }
    return (await isServerReachable()) === expected
  }

  function toStatus(running: boolean): ServerStatusResponse {
    return { running, port: null, managed: running && isManagedProcess(instanceId) }
  }

  function studioArgs(): string[] {
    const { hostname, port, protocol } = new URL(url)
    return [
      'studio',
      '--api-only',
      '--host',
      hostname,
      '--port',
      port || (protocol === 'https:' ? '443' : '80')
    ]
  }

  async function getServerStatus(): Promise<ServerStatusResponse> {
    return toStatus(await isServerReachable())
  }

  async function startServer(): Promise<ServerStatusResponse> {
    if (await isServerReachable()) {
      log.info(`Unsloth Studio already reachable at ${url}, nothing to start`)
      return toStatus(true)
    }

    try {
      await startManagedProcess(instanceId, UNSLOTH_EXECUTABLE, studioArgs())
    } catch (err) {
      log.error('Failed to spawn unsloth studio:', err)
      throw new ProviderError(
        'Could not start Unsloth Studio. Make sure unsloth is installed and on your PATH.',
        500
      )
    }

    if (!(await waitForReachable(true, START_TIMEOUT_MS))) {
      await stopManagedProcess(instanceId)
      throw new ProviderError(
        `Unsloth Studio did not become reachable at ${url} after ${START_TIMEOUT_MS / 1000} seconds`,
        504,
        'timeout'
      )
    }

    return toStatus(true)
  }

  async function stopServer(): Promise<ServerStatusResponse> {
    log.info('Stopping Unsloth Studio')
    try {
      await send('/api/shutdown', { method: 'POST' })
    } catch (err) {
      log.debug('Shutdown request failed, falling back to the managed process:', err)
    }

    await waitForReachable(false, STOP_TIMEOUT_MS)
    if (isManagedProcess(instanceId)) await stopManagedProcess(instanceId)

    const running = await isServerReachable()
    if (running) {
      throw new ProviderError(`Unsloth Studio is still reachable at ${url}`, 409, 'still_running')
    }
    return toStatus(false)
  }

  return {
    id: instanceId,

    capabilities: {
      chat: true,
      localModels: true,
      externalModels: false,
      downloadModel: true,
      downloadStatus: true,
      deleteModel: true,
      loadModel: true,
      serverControl: !remote,
      processLevelServerControl: true,
      requiresApiKey: true,
      modelRegistryUrl: 'https://unsloth.ai/docs/get-started/unsloth-model-catalog',
      huggingFaceModelsUrl: 'https://huggingface.co/models?apps=ollama'
    },

    fetchLocalModels,
    probeApiKey,
    chat,
    downloadModel,
    getDownloadStatus,
    deleteModel,
    loadModel,
    unloadModel,
    getServerStatus,
    startServer,
    stopServer
  }
}
