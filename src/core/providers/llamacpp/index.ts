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
  LlamaCppChatResponse,
  LlamaCppModelStatus,
  LlamaCppOpenAIModelsResponse,
  LlamaCppRouterModelsResponse
} from './types'
import {
  isEventForModel,
  isLoadedStatus,
  parseSseEvents,
  toChatRequest,
  toChatResponse,
  toDownloadProgressFromEvent,
  toHfRepoId,
  toLoadFailureError,
  toLocalModel,
  toLocalModelFromServedModel,
  toProviderError
} from './mappers'
import {
  isManagedProcess,
  startManagedProcess,
  stopManagedProcess
} from '../../../main/services/managed-process'
import { createLogger } from '../../../main/logger'

const log = createLogger('llama-cpp')

const STATUS_POLL_INTERVAL_MS = 500
const LOAD_TIMEOUT_MS = 10 * 60 * 1000
const UNLOAD_TIMEOUT_MS = 15000
const START_TIMEOUT_MS = 30000
const STOP_TIMEOUT_MS = 10000
const PROBE_INTERVAL_MS = 500
const LLAMA_EXECUTABLE = 'llama'
const ROUTER_MODE_MESSAGE =
  'Model management needs llama-server in router mode. This instance is serving a single model, start it with just `llama serve` to manage models.'

export function createLlamaCppProvider(
  instanceId: string,
  url: string,
  apiKey?: string,
  remote = false
): LLMProvider {
  const normalizedBase = url.replace(/\/$/, '')
  const auth = authHeader(apiKey)
  const downloadJobs = new Map<string, DownloadStatusResponse>()

  async function send(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(`${normalizedBase}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...auth, ...init?.headers }
    })
    if (!res.ok) {
      if (path.startsWith('/models') && (res.status === 404 || res.status === 501)) {
        throw new ProviderError(ROUTER_MODE_MESSAGE, res.status, 'router_mode_required')
      }
      const body = await res.json().catch(() => undefined)
      throw toProviderError(res.status, res.statusText, body)
    }
    return res
  }

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await send(path, init)
    return (await res.json()) as T
  }

  async function fetchServedModels(): Promise<LocalModel[]> {
    const data = await requestJson<LlamaCppOpenAIModelsResponse>('/v1/models')
    return data.data.map((m) => toLocalModelFromServedModel(m, instanceId))
  }

  async function fetchLocalModels(): Promise<LocalModel[]> {
    try {
      const data = await requestJson<LlamaCppRouterModelsResponse>('/models')
      return data.data.map((m) => toLocalModel(m, instanceId))
    } catch (err) {
      log.debug('Router model list unavailable, falling back to /v1/models:', err)
      return fetchServedModels()
    }
  }

  async function chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
    const body = toChatRequest(request)
    log.debug('Chat request body:', body)
    const response = await requestJson<LlamaCppChatResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: options?.abortSignal
    })
    return toChatResponse(response)
  }

  async function openEventStream(
    signal: AbortSignal
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const res = await send('/models/sse', { headers: { Accept: 'text/event-stream' }, signal })
    if (!res.body) throw new Error('[llamacpp] event stream has no body')
    return res.body.getReader()
  }

  async function watchDownload(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    modelName: string,
    jobId: string,
    startedAt: string
  ): Promise<void> {
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const { events, rest } = parseSseEvents(buffer)
        buffer = rest

        for (const event of events) {
          if (!isEventForModel(event.model, modelName)) continue
          log.debug('Download event:', event)
          if (event.event === 'download_progress' || event.event === 'model_status') {
            const progress = toDownloadProgressFromEvent(jobId, event, startedAt)
            if (progress) downloadJobs.set(jobId, progress)
          } else if (event.event === 'download_finished') {
            const previous = downloadJobs.get(jobId)
            downloadJobs.set(jobId, {
              ...previous,
              job_id: jobId,
              status: 'completed',
              downloaded_bytes: previous?.total_size_bytes ?? previous?.downloaded_bytes,
              started_at: startedAt,
              completed_at: new Date().toISOString()
            })
            return
          } else if (event.event === 'download_failed') {
            downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
            return
          }
        }
      }
      downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
    } finally {
      await reader.cancel().catch(() => undefined)
    }
  }

  async function downloadModel(
    downloadTarget: string,
    quantization?: string
  ): Promise<DownloadModelResponse> {
    const repoId = toHfRepoId(downloadTarget)
    const modelName = quantization && !repoId.includes(':') ? `${repoId}:${quantization}` : repoId
    log.debug(`Download target "${downloadTarget}" resolved to repo "${modelName}"`)
    const jobId = crypto.randomUUID()
    const startedAt = new Date().toISOString()
    downloadJobs.set(jobId, { job_id: jobId, status: 'downloading', started_at: startedAt })

    const controller = new AbortController()
    let reader: ReadableStreamDefaultReader<Uint8Array>
    try {
      reader = await openEventStream(controller.signal)
    } catch (err) {
      downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
      throw err
    }

    const watcher = watchDownload(reader, modelName, jobId, startedAt).catch((err) => {
      log.error(`Download event stream failed for model ${modelName}:`, err)
      downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
    })

    try {
      await send('/models', { method: 'POST', body: JSON.stringify({ model: modelName }) })
    } catch (err) {
      controller.abort()
      downloadJobs.set(jobId, { job_id: jobId, status: 'failed', started_at: startedAt })
      throw err
    }

    void watcher
    return { job_id: jobId, status: 'downloading', started_at: startedAt }
  }

  async function getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> {
    return downloadJobs.get(jobId) ?? { job_id: jobId, status: 'failed' }
  }

  async function deleteModel(modelId: string): Promise<void> {
    await send(`/models?model=${encodeURIComponent(modelId)}`, { method: 'DELETE' })
  }

  async function findModelStatus(modelId: string): Promise<LlamaCppModelStatus | undefined> {
    const data = await requestJson<LlamaCppRouterModelsResponse>('/models')
    return data.data.find((m) => m.id === modelId)?.status
  }

  async function waitForModelStatus(
    modelId: string,
    settled: (status: LlamaCppModelStatus | undefined) => boolean,
    failOnLoadFailure: boolean,
    timeoutMs: number
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const status = await findModelStatus(modelId)
      if (failOnLoadFailure && status?.failed) throw toLoadFailureError(modelId, status)
      if (settled(status)) return
      await new Promise<void>((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS))
    }
    throw new ProviderError(`Timed out waiting for model "${modelId}" to settle`, 504, 'timeout')
  }

  async function loadModel(modelId: string): Promise<void> {
    await send('/models/load', { method: 'POST', body: JSON.stringify({ model: modelId }) })
    await waitForModelStatus(modelId, isLoadedStatus, true, LOAD_TIMEOUT_MS)
  }

  async function unloadModel(loadedInstanceId: string): Promise<void> {
    await send('/models/unload', {
      method: 'POST',
      body: JSON.stringify({ model: loadedInstanceId })
    })
    await waitForModelStatus(
      loadedInstanceId,
      (status) => !isLoadedStatus(status),
      false,
      UNLOAD_TIMEOUT_MS
    )
  }

  async function isServerReachable(): Promise<boolean> {
    try {
      await fetch(`${normalizedBase}/health`, { headers: auth })
      return true
    } catch (err) {
      log.debug(`Server probe failed for ${url}:`, err)
      return false
    }
  }

  async function waitForReachable(expected: boolean, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if ((await isServerReachable()) === expected) return true
      await new Promise<void>((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS))
    }
    return isServerReachable()
  }

  function toStatus(running: boolean): ServerStatusResponse {
    return { running, port: null, managed: running && isManagedProcess(instanceId) }
  }

  function serveArgs(): string[] {
    const { hostname, port, protocol } = new URL(url)
    return ['serve', '--host', hostname, '--port', port || (protocol === 'https:' ? '443' : '80')]
  }

  async function getServerStatus(): Promise<ServerStatusResponse> {
    return toStatus(await isServerReachable())
  }

  async function startServer(): Promise<ServerStatusResponse> {
    if (await isServerReachable()) {
      log.info(`llama.cpp server already reachable at ${url}, nothing to start`)
      return toStatus(true)
    }

    try {
      await startManagedProcess(instanceId, LLAMA_EXECUTABLE, serveArgs())
    } catch (err) {
      log.error('Failed to spawn llama serve:', err)
      throw new ProviderError(
        'Could not start llama.cpp. Make sure llama is installed and on your PATH.',
        500
      )
    }

    if (!(await waitForReachable(true, START_TIMEOUT_MS))) {
      await stopManagedProcess(instanceId)
      throw new ProviderError(`llama.cpp server did not become reachable at ${url}`, 504, 'timeout')
    }

    return toStatus(true)
  }

  async function stopServer(): Promise<ServerStatusResponse> {
    if (!isManagedProcess(instanceId)) {
      throw new ProviderError(
        'This llama.cpp server was not started by Cannonade, so it cannot be stopped from here.',
        409
      )
    }

    await stopManagedProcess(instanceId)
    await waitForReachable(false, STOP_TIMEOUT_MS)
    return toStatus(await isServerReachable())
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
      requiresApiKey: false,
      huggingFaceModelsUrl: 'https://huggingface.co/models?apps=llama.cpp'
    },

    fetchLocalModels,
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
