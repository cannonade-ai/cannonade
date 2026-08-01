import { createGateway, streamText } from 'ai'
import type { LLMProvider } from '../base'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import { authHeader } from '@shared/provider/api-key'
import { toExternalModel, toChatPrompt, toChatResponse, mapError, toProviderError } from './mappers'
import type { GatewayModelListResponse } from './types'
import { createLogger } from '@main/logger'

const log = createLogger('vercel')

export function createVercelProvider(
  instanceId: string,
  url: string,
  apiKey?: string
): LLMProvider {
  const normalizedBase = url.replace(/\/$/, '')
  const gateway = createGateway({ apiKey, baseURL: `${normalizedBase}/v4/ai` })

  return {
    id: instanceId,

    capabilities: {
      chat: true,
      localModels: false,
      externalModels: true,
      downloadModel: false,
      downloadStatus: false,
      deleteModel: false,
      loadModel: false,
      serverControl: false,
      requiresApiKey: true
    },

    async fetchExternalModels(): Promise<ExternalModel[]> {
      const res = await fetch(`${normalizedBase}/v1/models`, {
        headers: { ...authHeader(apiKey) }
      })
      if (!res.ok) throw mapError(res.status, await res.text())
      const data = (await res.json()) as GatewayModelListResponse
      return data.data.map((m) => toExternalModel(m, instanceId))
    },

    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
      const prompt = toChatPrompt(request)
      log.debug('Chat request prompt:', prompt)

      const requestStartedAt = Date.now()
      let firstTokenAt: number | undefined
      let text = ''
      let reasoningText = ''

      const result = streamText({
        model: gateway(request.model),
        instructions: prompt.instructions,
        messages: prompt.messages,
        temperature: request.temperature,
        topP: request.top_p,
        topK: request.top_k,
        maxOutputTokens: request.max_output_tokens,
        presencePenalty: request.presence_penalty,
        frequencyPenalty: request.frequency_penalty,
        seed: request.seed,
        abortSignal: options?.abortSignal,
        onError: ({ error }): void => log.error('Chat stream error:', error)
      })

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          if (firstTokenAt === undefined) firstTokenAt = Date.now()
          text += part.text
        } else if (part.type === 'reasoning-delta') {
          if (firstTokenAt === undefined) firstTokenAt = Date.now()
          reasoningText += part.text
        } else if (part.type === 'error') {
          throw toProviderError(part.error)
        } else if (part.type === 'abort') {
          throw new DOMException('Chat request aborted', 'AbortError')
        }
      }

      const [usage, response] = await Promise.all([result.usage, result.response])
      return toChatResponse({
        text,
        reasoningText,
        modelId: response.modelId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        reasoningTokens: usage.outputTokenDetails.reasoningTokens,
        cachedInputTokens: usage.inputTokenDetails.cacheReadTokens,
        requestStartedAt,
        firstTokenAt,
        streamEndedAt: Date.now()
      })
    }
  }
}
