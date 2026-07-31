import type { ModelMessage } from 'ai'
import { ProviderError } from '../base'
import type {
  GatewayChatPrompt,
  GatewayErrorResponse,
  GatewayModel,
  StreamedChatResult
} from './types'
import type { ExternalModel, ExternalModelPricing } from '@shared/provider/external-model'
import { ModelModality } from '@shared/provider/external-model'
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatStats,
  OutputItem,
  TextInput
} from '@shared/provider/chat'
import { perTokenToPerMillion } from '@shared/utils/number'
import { createLogger } from '@main/logger'

const log = createLogger('vercel-mapper')

export function mapError(status: number, raw: string): ProviderError {
  if (status === 401) {
    return new ProviderError('Invalid or missing Vercel AI Gateway API key', status)
  }
  if (status === 429) return new ProviderError('Rate limited by Vercel AI Gateway', status)
  try {
    const parsed = JSON.parse(raw) as GatewayErrorResponse
    if (parsed.error?.message) {
      return new ProviderError(parsed.error.message, status, parsed.error.type)
    }
  } catch (e) {
    log.debug('Error response body is not JSON:', e)
  }
  return new ProviderError(`HTTP ${status}`, status)
}

export function toProviderError(error: unknown): Error {
  if (error instanceof Error) {
    const status = (error as Error & { statusCode?: number }).statusCode
    if (typeof status === 'number') return new ProviderError(error.message, status)
    return error
  }
  return new Error(String(error))
}

const OUTPUT_MODALITIES_BY_TYPE: Record<string, string[]> = {
  language: [ModelModality.Text],
  embedding: [ModelModality.Embeddings],
  image: [ModelModality.Image],
  video: [ModelModality.Video],
  reranking: [ModelModality.Rerank]
}

function toPricing(m: GatewayModel): ExternalModelPricing | undefined {
  const inputPerMTokens = perTokenToPerMillion(m.pricing?.input)
  const outputPerMTokens = perTokenToPerMillion(m.pricing?.output)
  if (inputPerMTokens === undefined || outputPerMTokens === undefined) return undefined
  if (inputPerMTokens < 0 || outputPerMTokens < 0) return undefined
  const cacheReadPerMTokens = perTokenToPerMillion(m.pricing?.input_cache_read)
  return {
    inputPerMTokens,
    outputPerMTokens,
    ...(cacheReadPerMTokens !== undefined && cacheReadPerMTokens > 0 ? { cacheReadPerMTokens } : {})
  }
}

function toInputModalities(m: GatewayModel): string[] {
  const modalities: string[] = [ModelModality.Text]
  if (m.tags?.includes('vision')) modalities.push(ModelModality.Image)
  if (m.tags?.includes('file-input')) modalities.push(ModelModality.File)
  return modalities
}

export function toExternalModel(m: GatewayModel, instanceId: string): ExternalModel {
  return {
    id: m.id,
    name: m.name,
    publisher: m.owned_by ?? m.id.split('/')[0] ?? m.id,
    providerId: instanceId,
    description: m.description ?? undefined,
    contextLength: m.context_window ?? 0,
    maxOutputTokens: m.max_tokens ?? undefined,
    inputModalities: m.modalities?.input ?? toInputModalities(m),
    outputModalities: m.modalities?.output ??
      OUTPUT_MODALITIES_BY_TYPE[m.type ?? 'language'] ?? [ModelModality.Text],
    pricing: toPricing(m),
    supportedParameters: m.supported_parameters,
    knowledgeCutoff: m.knowledge ?? undefined,
    createdAt: m.created ?? m.released ?? undefined,
    releasedAt: m.released ?? m.created ?? undefined,
    raw: { ...m } as Record<string, unknown>
  }
}

function toSourceMessages(request: ChatRequest): ChatMessage[] {
  if (request.messages?.length) {
    const messages: ChatMessage[] = request.messages.map((m) => ({ ...m }))
    if (request.system_prompt && !request.messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.system_prompt })
    }
    return messages
  }

  const messages: ChatMessage[] = []

  if (request.system_prompt) {
    messages.push({ role: 'system', content: request.system_prompt })
  }

  if (typeof request.input === 'string') {
    messages.push({ role: 'user', content: request.input })
  } else {
    const text = (request.input ?? [])
      .filter((item) => item.type === 'message')
      .map((item) => (item as TextInput).content)
      .join('\n')
    messages.push({ role: 'user', content: text })
  }

  return messages
}

export function toChatPrompt(request: ChatRequest): GatewayChatPrompt {
  const source = toSourceMessages(request)
  const systemContents = source.filter((m) => m.role === 'system').map((m) => m.content)
  const messages = source
    .filter((m) => m.role !== 'system')
    .map((m): ModelMessage => {
      if (m.role === 'assistant') return { role: 'assistant', content: m.content }
      return { role: 'user', content: m.content }
    })
  return {
    instructions: systemContents.length > 0 ? systemContents.join('\n') : undefined,
    messages
  }
}

export function toChatResponse(result: StreamedChatResult): ChatResponse {
  const output: OutputItem[] = []
  if (result.reasoningText) output.push({ type: 'reasoning', content: result.reasoningText })
  output.push({ type: 'message', content: result.text })

  const outputTokens = result.outputTokens ?? 0
  const generationSeconds =
    result.firstTokenAt !== undefined ? (result.streamEndedAt - result.firstTokenAt) / 1000 : 0

  const stats: ChatStats = {
    input_tokens: result.inputTokens ?? 0,
    total_output_tokens: outputTokens,
    reasoning_output_tokens: result.reasoningTokens ?? 0,
    tokens_per_second: generationSeconds > 0 ? outputTokens / generationSeconds : 0,
    time_to_first_token_seconds:
      result.firstTokenAt !== undefined ? (result.firstTokenAt - result.requestStartedAt) / 1000 : 0
  }
  if (result.cachedInputTokens !== undefined) {
    stats.cached_input_tokens = result.cachedInputTokens
  }

  return {
    model_instance_id: result.modelId,
    output,
    stats
  }
}
