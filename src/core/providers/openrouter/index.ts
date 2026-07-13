import { ProviderError, type LLMProvider } from '../base'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import { authHeader } from '@shared/provider/api-key'
import { toExternalModel, toChatRequest, toChatResponse } from './mappers'
import type { ChatCompletionResponse, ErrorResponse, ModelListResponse } from './types'
import { createLogger } from '../../../main/logger'

const log = createLogger('openrouter')

const ATTRIBUTION_HEADERS = {
  'HTTP-Referer': 'https://github.com/BekirUzun/cannonade',
  'X-Title': 'Cannonade'
}

function mapError(status: number, raw: string): ProviderError {
  if (status === 401) return new ProviderError('Invalid or missing OpenRouter API key', status)
  if (status === 402) return new ProviderError('Insufficient OpenRouter credits', status)
  if (status === 429) return new ProviderError('Rate limited by OpenRouter', status)
  try {
    const parsed = JSON.parse(raw) as ErrorResponse
    if (parsed.error?.message) return new ProviderError(parsed.error.message, status)
  } catch (e) {
    log.debug('Error response body is not JSON:', e)
  }
  return new ProviderError(`HTTP ${status}`, status)
}

export function createOpenRouterProvider(
  instanceId: string,
  baseUrl: string,
  apiKey?: string
): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const auth = authHeader(apiKey)

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
      const res = await fetch(`${normalizedBase}/models`, { headers: { ...auth } })
      if (!res.ok) throw mapError(res.status, await res.text())
      const data = (await res.json()) as ModelListResponse
      return data.data.map((m) => toExternalModel(m, instanceId))
    },

    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
      const body = toChatRequest(request)
      log.debug('Chat request body:', body)
      const res = await fetch(`${normalizedBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth, ...ATTRIBUTION_HEADERS },
        body: JSON.stringify(body),
        signal: options?.abortSignal
      })
      if (!res.ok) throw mapError(res.status, await res.text())
      return toChatResponse((await res.json()) as ChatCompletionResponse)
    }
  }
}
