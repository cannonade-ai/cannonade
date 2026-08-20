import type { ChatCompletionRequest, ChatCompletionResponse, Model, ReasoningEffort } from './types'
import type { ExternalModel, ExternalModelPricing } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatStats, OutputItem } from '@shared/provider/chat'
import { withExtraRequestData } from '@shared/provider/chat'
import { toChatRequest as toOpenAIChatRequest } from '../openai-compat/mappers'
import { perTokenToPerMillion } from '@shared/utils/number'

function toPricing(m: Model): ExternalModelPricing | undefined {
  const inputPerMTokens = perTokenToPerMillion(m.pricing?.prompt)
  const outputPerMTokens = perTokenToPerMillion(m.pricing?.completion)
  if (inputPerMTokens === undefined || outputPerMTokens === undefined) return undefined
  if (inputPerMTokens < 0 || outputPerMTokens < 0) return undefined
  const cacheReadPerMTokens = perTokenToPerMillion(m.pricing?.input_cache_read)
  return {
    inputPerMTokens,
    outputPerMTokens,
    ...(cacheReadPerMTokens !== undefined && cacheReadPerMTokens > 0 ? { cacheReadPerMTokens } : {})
  }
}

export function toReasoningEffort(
  reasoning: 'off' | 'low' | 'medium' | 'high' | 'on' | undefined
): ReasoningEffort | undefined {
  if (reasoning === undefined) return undefined
  if (reasoning === 'off') return 'none'
  if (reasoning === 'on') return 'medium'
  return reasoning
}

export function toChatRequest(request: ChatRequest): ChatCompletionRequest {
  const effort = toReasoningEffort(request.reasoning)
  return withExtraRequestData(
    {
      ...toOpenAIChatRequest(request),
      ...(effort ? { reasoning: { effort } } : {})
    },
    request
  )
}

export function toChatResponse(response: ChatCompletionResponse): ChatResponse {
  const message = response.choices[0]?.message
  const usage = response.usage

  const output: OutputItem[] = []
  if (message?.reasoning) output.push({ type: 'reasoning', content: message.reasoning })
  output.push({ type: 'message', content: message?.content ?? '' })

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
  if (usage?.cost !== undefined) stats.cost = usage.cost
  if (usage?.cost_details !== undefined) stats.cost_details = usage.cost_details

  return {
    model_instance_id: response.id,
    output,
    stats
  }
}

export function toExternalModel(m: Model, instanceId: string): ExternalModel {
  return {
    id: m.id,
    name: m.name,
    publisher: m.id.split('/')[0] ?? m.id,
    providerId: instanceId,
    description: m.description ?? undefined,
    contextLength: m.context_length ?? m.top_provider?.context_length ?? 0,
    maxOutputTokens: m.top_provider?.max_completion_tokens ?? undefined,
    inputModalities: m.architecture?.input_modalities,
    outputModalities: m.architecture?.output_modalities,
    pricing: toPricing(m),
    supportedParameters: m.supported_parameters,
    createdAt: m.created,
    knowledgeCutoff: m.knowledge_cutoff ?? undefined,
    expirationDate: m.expiration_date ?? undefined,
    isModerated: m.top_provider?.is_moderated,
    raw: { ...m } as Record<string, unknown>
  }
}
