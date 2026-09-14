import type { LLMProvider } from '../base'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import { authHeader } from '@shared/provider/api-key'
import { toExternalModel, toChatRequest, toChatResponse, toProviderError } from './mappers'
import type { ChatCompletionResponse, ModelListResponse } from './types'
import { createLogger } from '../../../main/logger'

const log = createLogger('openai')

const MODEL_DETAILS_NOTICE =
  'Pricing, context length and modalities are not returned by this provider and come from a built-in table. They may be out of date, and newly released models may show no details at all.'

export function createOpenAIProvider(
  instanceId: string,
  baseUrl: string,
  apiKey?: string
): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const auth = authHeader(apiKey)

  async function send(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(`${normalizedBase}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...auth, ...init?.headers }
    })
    if (!res.ok) {
      log.debug(
        `Request to ${path} failed with ${res.status}, request id:`,
        res.headers.get('x-request-id')
      )
      throw toProviderError(res.status, await res.text())
    }
    return res
  }

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
      requiresApiKey: true,
      providerNotice: MODEL_DETAILS_NOTICE
    },

    async fetchExternalModels(): Promise<ExternalModel[]> {
      const res = await send('/models')
      const data = (await res.json()) as ModelListResponse
      return data.data.map((m) => toExternalModel(m, instanceId))
    },

    async probeApiKey(): Promise<void> {
      await send('/models')
    },

    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
      const body = toChatRequest(request)
      log.debug('Chat request body:', body)
      const res = await send('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: options?.abortSignal
      })
      return toChatResponse((await res.json()) as ChatCompletionResponse)
    }
  }
}
