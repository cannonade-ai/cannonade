import type { LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import { OpenAIModelsResponse } from './types'
import type { OpenAIChatResponse } from '../openai-compat/types'
import { authHeader } from '@shared/provider/api-key'
import { toLocalModel } from './mappers'
import { toChatRequest, toChatResponse } from '../openai-compat/mappers'
import { createLogger } from '../../../main/logger'

const log = createLogger('custom-provider')

export function createCustomProvider(
  instanceId: string,
  baseUrl: string,
  apiKey?: string
): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const auth = authHeader(apiKey)

  async function fetchLocalModels(): Promise<LocalModel[]> {
    const res = await fetch(`${normalizedBase}/v1/models`, {
      headers: { 'Content-Type': 'application/json', ...auth }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as OpenAIModelsResponse
    return data.data.map((m) => toLocalModel(m, instanceId))
  }

  async function chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
    const body = toChatRequest(request)
    log.debug('Chat request body:', body)
    const res = await fetch(`${normalizedBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(body),
      signal: options?.abortSignal
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    return toChatResponse((await res.json()) as OpenAIChatResponse)
  }

  return {
    id: instanceId,
    capabilities: {
      chat: true,
      localModels: true,
      externalModels: false,
      downloadModel: false,
      downloadStatus: false,
      deleteModel: false,
      loadModel: false,
      serverControl: false,
      requiresApiKey: false
    },
    fetchLocalModels,
    chat
  }
}
