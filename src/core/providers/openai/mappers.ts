import type { ChatCompletionResponse, ErrorResponse, Model } from './types'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatStats, OutputItem } from '@shared/provider/chat'
import { withExtraRequestData } from '@shared/provider/chat'
import { toChatRequest as toOpenAIChatRequest } from '../openai-compat/mappers'
import type { OpenAIChatMessage } from '../openai-compat/types'
import { toReasoningEffort } from '../openrouter/mappers'
import { ProviderError } from '../base'
import { findOpenAIModelMetadata } from './models'
import { createLogger } from '../../../main/logger'

const log = createLogger('openai')

export interface ChatCompletionRequest {
  model: string
  messages: OpenAIChatMessage[]
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
  min_p?: number
  repeat_penalty?: number
  max_completion_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  seed?: number
  reasoning_effort?: string
}

export function toChatRequest(request: ChatRequest): ChatCompletionRequest {
  const { messages, model } = toOpenAIChatRequest(request)
  const effort = toReasoningEffort(request.reasoning)
  const body: ChatCompletionRequest = { model, messages }

  if (request.stream !== undefined) body.stream = request.stream
  if (request.temperature !== undefined) body.temperature = request.temperature
  if (request.top_p !== undefined) body.top_p = request.top_p
  if (request.top_k !== undefined) body.top_k = request.top_k
  if (request.min_p !== undefined) body.min_p = request.min_p
  if (request.repeat_penalty !== undefined) body.repeat_penalty = request.repeat_penalty
  if (request.presence_penalty !== undefined) body.presence_penalty = request.presence_penalty
  if (request.frequency_penalty !== undefined) body.frequency_penalty = request.frequency_penalty
  if (request.seed !== undefined) body.seed = request.seed
  if (request.max_output_tokens !== undefined)
    body.max_completion_tokens = request.max_output_tokens
  if (effort) body.reasoning_effort = effort

  return withExtraRequestData(body, request)
}

export function toChatResponse(response: ChatCompletionResponse): ChatResponse {
  const message = response.choices[0]?.message
  const usage = response.usage

  const output: OutputItem[] = []
  output.push({ type: 'message', content: message?.refusal || (message?.content ?? '') })

  const stats: ChatStats = {
    input_tokens: usage?.prompt_tokens ?? 0,
    total_output_tokens: usage?.completion_tokens ?? 0,
    reasoning_output_tokens: usage?.completion_tokens_details?.reasoning_tokens ?? 0,
    tokens_per_second: 0,
    time_to_first_token_seconds: 0
  }
  if (usage?.prompt_tokens_details?.cached_tokens !== undefined) {
    stats.cached_input_tokens = usage.prompt_tokens_details.cached_tokens
  }

  return {
    model_instance_id: response.id,
    output,
    stats
  }
}

export function toProviderError(status: number, raw: string): ProviderError {
  let parsed: ErrorResponse | undefined
  try {
    parsed = JSON.parse(raw) as ErrorResponse
  } catch (e) {
    log.debug('Error response body is not JSON:', e)
  }

  const code = parsed?.error?.code ?? undefined
  if (code === 'insufficient_quota') {
    return new ProviderError('OpenAI quota exhausted, check your billing', status, code)
  }
  if (status === 401) return new ProviderError('Invalid or missing OpenAI API key', status, code)
  if (status === 403)
    return new ProviderError('OpenAI denied access to this resource', status, code)
  if (status === 429) return new ProviderError('Rate limited by OpenAI', status, code)
  if (parsed?.error?.message) return new ProviderError(parsed.error.message, status, code)
  return new ProviderError(`HTTP ${status}`, status, code)
}

export function toExternalModel(m: Model, instanceId: string): ExternalModel {
  const metadata = findOpenAIModelMetadata(m.id)
  return {
    id: m.id,
    name: m.id,
    publisher: m.owned_by ?? 'openai',
    providerId: instanceId,
    description: metadata?.description,
    contextLength: metadata?.contextLength ?? 0,
    maxOutputTokens: metadata?.maxOutputTokens,
    inputModalities: metadata?.inputModalities,
    outputModalities: metadata?.outputModalities,
    pricing: metadata?.pricing,
    createdAt: m.created,
    knowledgeCutoff: metadata?.knowledgeCutoff,
    expirationDate: m.shutdown_date ?? undefined,
    raw: { ...m } as Record<string, unknown>
  }
}
