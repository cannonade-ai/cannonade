import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, OutputItem } from '@shared/provider/chat'
import { withExtraRequestData } from '@shared/provider/chat'
import type { DownloadStatusResponse } from '@shared/provider/ipc-contracts'
import { toChatRequest as toOpenAIChatRequest } from '../openai-compat/mappers'
import { ProviderError } from '../base'
import type {
  UnslothChatRequest,
  UnslothChatResponse,
  UnslothDownloadJobStatus,
  UnslothDownloadProgress,
  UnslothErrorBody,
  UnslothInferenceStatus,
  UnslothModel
} from './types'

const HF_HOSTS = ['huggingface.co', 'hf.co']

export interface ModelSelector {
  repoId: string
  variant?: string
}

export function toModelKey(repoId: string, variant?: string): string {
  return variant ? `${repoId}:${variant}` : repoId
}

export function toModelSelector(modelKey: string): ModelSelector {
  const separator = modelKey.lastIndexOf(':')
  if (separator <= 0) return { repoId: modelKey }
  const variant = modelKey.slice(separator + 1)
  if (!variant || /[\\/]/.test(variant)) return { repoId: modelKey }
  return { repoId: modelKey.slice(0, separator), variant }
}

export function toRepoId(downloadTarget: string): string {
  const trimmed = downloadTarget.trim()
  const withoutScheme = trimmed.replace(/^https?:\/\//i, '')
  const [host, ...hostPath] = withoutScheme.split('/')
  const path = HF_HOSTS.includes(host.toLowerCase()) ? hostPath.join('/') : withoutScheme
  const segments = path.split('?')[0].split('#')[0].split('/').filter(Boolean)
  return segments.length < 2 ? trimmed : segments.slice(0, 2).join('/')
}

function toDisplayName(model: UnslothModel): string {
  if (model.display_name) return model.display_name
  const parts = model.id.split('/')
  return parts[parts.length - 1]
}

function toModelType(model: UnslothModel): 'llm' | 'embedding' {
  return model.id.toLowerCase().includes('embed') ? 'embedding' : 'llm'
}

export function toLocalModel(model: UnslothModel, instanceId: string): LocalModel {
  const key = toModelKey(model.id, model.quant)
  const meta: Record<string, string | number> = {}
  const publisher = model.id.includes('/') ? model.id.split('/')[0] : undefined
  if (publisher) meta.publisher = publisher
  if (model.quant) meta.quantization = model.quant
  if (model.owned_by) meta.owned_by = model.owned_by

  const contextLength = model.context_length ?? model.native_context_length ?? undefined
  const maxContextLength = model.max_context_length ?? contextLength

  return {
    id: key,
    name: toDisplayName(model),
    providerId: instanceId,
    sizeBytes: 0,
    type: toModelType(model),
    loadedInstances: model.loaded ? [{ id: key, config: { context_length: contextLength } }] : [],
    maxContextLength: maxContextLength ?? undefined,
    meta
  }
}

export function toCapabilities(status: UnslothInferenceStatus): {
  vision: boolean
  trained_for_tool_use: boolean
} {
  return {
    vision: status.is_vision === true,
    trained_for_tool_use: status.supports_tools === true
  }
}

export function withActiveModelVariant(
  model: UnslothModel,
  status: UnslothInferenceStatus
): UnslothModel {
  if (model.quant || !status.gguf_variant) return model
  if (model.id !== status.active_model) return model
  return { ...model, quant: status.gguf_variant }
}

export function toLocalModels(
  models: UnslothModel[],
  instanceId: string,
  status: UnslothInferenceStatus | undefined
): LocalModel[] {
  if (!status) return models.map((model) => toLocalModel(model, instanceId))

  const capabilities = toCapabilities(status)
  return models.map((model) => {
    const local = toLocalModel(withActiveModelVariant(model, status), instanceId)
    return isModelLoaded(status, local.id) ? { ...local, capabilities } : local
  })
}

export function toLoadedModelKeys(status: UnslothInferenceStatus): string[] {
  return (status.loaded ?? []).map((model) =>
    model === status.active_model ? toModelKey(model, status.gguf_variant ?? undefined) : model
  )
}

export function isModelLoaded(status: UnslothInferenceStatus, modelKey: string): boolean {
  const { repoId } = toModelSelector(modelKey)
  return (status.loaded ?? []).some((loaded) => loaded === repoId || loaded === modelKey)
}

export function toChatRequest(request: ChatRequest): UnslothChatRequest {
  const base = toOpenAIChatRequest(request)
  const { repoId } = toModelSelector(request.model)
  return withExtraRequestData(
    { ...base, model: repoId, stream: false, min_p: request.min_p },
    request
  )
}

export function toChatResponse(response: UnslothChatResponse): ChatResponse {
  const message = response.choices[0]?.message
  const output: OutputItem[] = []
  if (message?.reasoning_content) {
    output.push({ type: 'reasoning', content: message.reasoning_content })
  }
  output.push({ type: 'message', content: message?.content ?? '' })

  return {
    model_instance_id: response.model || response.id,
    output,
    stats: {
      input_tokens: response.usage?.prompt_tokens ?? 0,
      total_output_tokens: response.usage?.completion_tokens ?? 0,
      reasoning_output_tokens: response.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
      tokens_per_second: 0,
      time_to_first_token_seconds: 0,
      cached_input_tokens: response.usage?.prompt_tokens_details?.cached_tokens
    }
  }
}

const FAILED_DOWNLOAD_STATES = ['failed', 'error', 'cancelled', 'canceled']
const COMPLETED_DOWNLOAD_STATES = ['complete', 'completed', 'done', 'finished']

export function toDownloadStatus(
  jobId: string,
  job: UnslothDownloadJobStatus,
  progress: UnslothDownloadProgress | undefined,
  startedAt: string
): DownloadStatusResponse {
  const downloaded = progress?.downloaded_bytes
  const total = progress?.expected_bytes || undefined
  const state = (job.state ?? '').toLowerCase()
  const elapsedSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000

  const base: DownloadStatusResponse = {
    job_id: jobId,
    status: 'downloading',
    downloaded_bytes: downloaded,
    total_size_bytes: total,
    started_at: startedAt,
    bytes_per_second:
      downloaded && elapsedSeconds > 0 ? Math.round(downloaded / elapsedSeconds) : undefined
  }

  if (job.error || FAILED_DOWNLOAD_STATES.includes(state)) {
    return { ...base, status: 'failed' }
  }
  if (COMPLETED_DOWNLOAD_STATES.includes(state) || progress?.complete_on_disk) {
    return {
      ...base,
      status: 'completed',
      downloaded_bytes: downloaded ?? total,
      completed_at: new Date().toISOString()
    }
  }
  if (state === 'paused') return { ...base, status: 'paused' }

  return base
}

export function toProviderError(status: number, statusText: string, body: unknown): ProviderError {
  const parsed = body as UnslothErrorBody | undefined
  const detail = parsed?.detail
  const message =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail
            .map((d) => d.msg)
            .filter(Boolean)
            .join(', ')
        : parsed?.error?.message

  return new ProviderError(
    message || statusText || `HTTP ${status}`,
    status,
    parsed?.error?.type ?? parsed?.error?.code
  )
}
