import { ProviderError, type LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import type { DownloadModelResponse, DownloadStatusResponse } from '@shared/provider/ipc-contracts'
import { authHeader } from '@shared/provider/api-key'
import type {
  LlamaCppChatResponse,
  LlamaCppModelStatus,
  LlamaCppOpenAIModelsResponse,
  LlamaCppRouterModelsResponse
} from './types'
import {
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
import { createLogger } from '../../../main/logger'

const log = createLogger('llama-cpp')

const STATUS_POLL_INTERVAL_MS = 500
const STATUS_TIMEOUT_MS = 60 * 1000

export function createLlamaCppProvider(
  instanceId: string,
  url: string,
  apiKey?: string
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

  async function watchDownload(
    modelName: string,
    jobId: string,
    startedAt: string,
    signal: AbortSignal
  ): Promise<void> {
    const res = await send('/models/sse', { headers: { Accept: 'text/event-stream' }, signal })
    if (!res.body) throw new Error('[llamacpp] event stream has no body')

    const reader = res.body.getReader()
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
          if (event.model !== modelName) continue
          log.debug('Download event:', event)
          if (event.event === 'download_progress' || event.event === 'model_status') {
            const progress = toDownloadProgressFromEvent(jobId, event, startedAt)
            if (progress) downloadJobs.set(jobId, progress)
          } else if (event.event === 'download_finished') {
            downloadJobs.set(jobId, {
              ...downloadJobs.get(jobId),
              job_id: jobId,
              status: 'completed',
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

  async function downloadModel(downloadTarget: string): Promise<DownloadModelResponse> {
    const modelName = toHfRepoId(downloadTarget)
    log.debug(`Download target "${downloadTarget}" resolved to repo "${modelName}"`)
    const jobId = crypto.randomUUID()
    const startedAt = new Date().toISOString()
    downloadJobs.set(jobId, { job_id: jobId, status: 'downloading', started_at: startedAt })

    const controller = new AbortController()
    const watcher = watchDownload(modelName, jobId, startedAt, controller.signal).catch((err) => {
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
    settled: (status: LlamaCppModelStatus | undefined) => boolean
  ): Promise<void> {
    const deadline = Date.now() + STATUS_TIMEOUT_MS
    while (Date.now() < deadline) {
      const status = await findModelStatus(modelId)
      if (status?.failed) throw toLoadFailureError(modelId, status)
      if (settled(status)) return
      await new Promise<void>((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS))
    }
    throw new ProviderError(`Timed out waiting for model "${modelId}" to settle`, 504, 'timeout')
  }

  async function loadModel(modelId: string): Promise<void> {
    await send('/models/load', { method: 'POST', body: JSON.stringify({ model: modelId }) })
    await waitForModelStatus(modelId, isLoadedStatus)
  }

  async function unloadModel(loadedInstanceId: string): Promise<void> {
    await send('/models/unload', {
      method: 'POST',
      body: JSON.stringify({ model: loadedInstanceId })
    })
    await waitForModelStatus(loadedInstanceId, (status) => !isLoadedStatus(status))
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
      serverControl: false,
      requiresApiKey: false,
      huggingFaceModelsUrl: 'https://huggingface.co/models?apps=llama.cpp'
    },

    fetchLocalModels,
    chat,
    downloadModel,
    getDownloadStatus,
    deleteModel,
    loadModel,
    unloadModel
  }
}
