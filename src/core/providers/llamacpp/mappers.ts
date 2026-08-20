import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, OutputItem } from '@shared/provider/chat'
import { withExtraRequestData } from '@shared/provider/chat'
import type { DownloadStatusResponse } from '@shared/provider/ipc-contracts'
import { toChatRequest as toOpenAIChatRequest } from '../openai-compat/mappers'
import { ProviderError } from '../base'
import type {
  LlamaCppChatRequest,
  LlamaCppChatResponse,
  LlamaCppDownloadProgress,
  LlamaCppErrorBody,
  LlamaCppModelMeta,
  LlamaCppModelStatus,
  LlamaCppOpenAIModel,
  LlamaCppRouterModel,
  LlamaCppSseEvent
} from './types'

const LOADED_STATUSES = ['loaded', 'sleeping']
const HF_HOSTS = ['huggingface.co', 'hf.co']

export function isLoadedStatus(status: LlamaCppModelStatus | undefined): boolean {
  return LOADED_STATUSES.includes(status?.value ?? '')
}

export function toLoadFailureError(
  modelId: string,
  status: LlamaCppModelStatus | undefined
): ProviderError {
  const exitCode = status?.exit_code === undefined ? '' : ` (exit code ${status.exit_code})`
  return new ProviderError(`Model "${modelId}" failed to load${exitCode}`, 500, 'load_failed')
}

function toDisplayName(id: string): string {
  const withoutQuant = id.split(':')[0]
  const parts = withoutQuant.split('/')
  return parts[parts.length - 1]
}

function toMeta(id: string, model: LlamaCppModelMeta | null | undefined): Record<string, string> {
  const meta: Record<string, string> = {}
  const parts = id.split('/')
  if (parts.length > 1) meta.publisher = parts[0]
  const quantization = id.split(':')[1]
  if (quantization) meta.quantization = quantization
  if (model?.n_params) meta.params_string = `${Math.round(model.n_params / 1e6) / 1000}B`
  return meta
}

function toModelType(id: string): 'llm' | 'embedding' {
  return id.toLowerCase().includes('embed') ? 'embedding' : 'llm'
}

export function toLocalModel(model: LlamaCppRouterModel, instanceId: string): LocalModel {
  const meta = toMeta(model.id, model.meta)
  if (model.status?.value) meta.status = model.status.value
  if (model.source) meta.source = model.source

  const inputModalities = model.architecture?.input_modalities ?? []
  const loaded = isLoadedStatus(model.status)

  return {
    id: model.id,
    name: toDisplayName(model.id),
    providerId: instanceId,
    sizeBytes: model.meta?.size ?? 0,
    type: toModelType(model.id),
    loadedInstances: loaded
      ? [{ id: model.id, config: { context_length: model.meta?.n_ctx_train } }]
      : [],
    capabilities: {
      vision: inputModalities.includes('image'),
      trained_for_tool_use: false
    },
    maxContextLength: model.meta?.n_ctx_train,
    meta
  }
}

export function toLocalModelFromServedModel(
  model: LlamaCppOpenAIModel,
  instanceId: string
): LocalModel {
  return {
    id: model.id,
    name: toDisplayName(model.id),
    providerId: instanceId,
    sizeBytes: model.meta?.size ?? 0,
    type: toModelType(model.id),
    loadedInstances: model.meta
      ? [{ id: model.id, config: { context_length: model.meta.n_ctx_train } }]
      : [],
    maxContextLength: model.meta?.n_ctx_train,
    meta: toMeta(model.id, model.meta)
  }
}

export function toHfRepoId(downloadTarget: string): string {
  const trimmed = downloadTarget.trim()
  const withoutScheme = trimmed.replace(/^https?:\/\//i, '')
  const [host, ...hostPath] = withoutScheme.split('/')
  const path = HF_HOSTS.includes(host.toLowerCase()) ? hostPath.join('/') : withoutScheme
  const segments = path.split('?')[0].split('#')[0].split('/').filter(Boolean)
  return segments.length < 2 ? trimmed : segments.slice(0, 2).join('/')
}

export function isEventForModel(eventModel: string | undefined, modelName: string): boolean {
  if (!eventModel) return false
  const event = eventModel.toLowerCase()
  const model = modelName.toLowerCase()
  return event === model || event.startsWith(`${model}:`) || model.startsWith(`${event}:`)
}

export function toChatRequest(request: ChatRequest): LlamaCppChatRequest {
  const base = toOpenAIChatRequest(request)
  return withExtraRequestData(
    {
      ...base,
      stream: false,
      min_p: request.min_p,
      timings_per_token: true,
      reasoning_effort: request.reasoning === 'off' ? 'none' : undefined
    },
    request
  )
}

export function toChatResponse(response: LlamaCppChatResponse): ChatResponse {
  const message = response.choices[0]?.message
  const output: OutputItem[] = []
  if (message?.reasoning_content) {
    output.push({ type: 'reasoning', content: message.reasoning_content })
  }
  output.push({ type: 'message', content: message?.content ?? '' })

  const timings = response.timings

  return {
    model_instance_id: response.model || response.id,
    output,
    stats: {
      input_tokens: response.usage?.prompt_tokens ?? 0,
      total_output_tokens: response.usage?.completion_tokens ?? 0,
      reasoning_output_tokens: 0,
      tokens_per_second: timings?.predicted_per_second ?? 0,
      time_to_first_token_seconds: (timings?.prompt_ms ?? 0) / 1000,
      cached_input_tokens: response.usage?.prompt_tokens_details?.cached_tokens
    }
  }
}

export function toProviderError(status: number, statusText: string, body: unknown): ProviderError {
  const error = (body as LlamaCppErrorBody | undefined)?.error
  return new ProviderError(error?.message ?? statusText ?? `HTTP ${status}`, status, error?.type)
}

export function parseSseEvents(buffer: string): { events: LlamaCppSseEvent[]; rest: string } {
  const chunks = buffer.split('\n\n')
  const rest = chunks.pop() ?? ''
  const events: LlamaCppSseEvent[] = []

  for (const chunk of chunks) {
    const payload = chunk
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .join('')
    if (!payload) continue
    try {
      events.push(JSON.parse(payload) as LlamaCppSseEvent)
    } catch {
      continue
    }
  }

  return { events, rest }
}

export function toDownloadProgress(
  jobId: string,
  progress: Record<string, LlamaCppDownloadProgress>,
  startedAt: string
): DownloadStatusResponse {
  const files = Object.values(progress)
  const downloaded = files.reduce((sum, file) => sum + (file.done ?? 0), 0)
  const total = files.reduce((sum, file) => sum + (file.total ?? 0), 0)
  const elapsedSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000

  return {
    job_id: jobId,
    status: 'downloading',
    downloaded_bytes: downloaded,
    total_size_bytes: total,
    started_at: startedAt,
    bytes_per_second: elapsedSeconds > 0 ? Math.round(downloaded / elapsedSeconds) : 0
  }
}

function isProgressEntry(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'total' in value
}

export function toDownloadProgressMap(
  data: Record<string, unknown> | undefined
): Record<string, LlamaCppDownloadProgress> {
  for (const source of [data, data?.progress]) {
    if (typeof source !== 'object' || source === null) continue
    const entries = Object.entries(source).filter(([, value]) => isProgressEntry(value))
    if (entries.length) {
      return Object.fromEntries(entries) as Record<string, LlamaCppDownloadProgress>
    }
  }
  return {}
}

export function toDownloadProgressFromEvent(
  jobId: string,
  event: LlamaCppSseEvent,
  startedAt: string
): DownloadStatusResponse | undefined {
  const progress = toDownloadProgressMap(event.data)
  if (!Object.keys(progress).length) return undefined
  return toDownloadProgress(jobId, progress, startedAt)
}
