import type { LLMProvider } from './base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

interface OpenAIModel {
  id: string
  object: string
  owned_by?: string
}

interface OpenAIModelsResponse {
  data: OpenAIModel[]
}

interface OpenAIChatResponse {
  id: string
  choices: {
    message: { role: string; content: string }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

export function createCustomProvider(instanceId: string, baseUrl: string): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')

  async function fetchLocalModels(): Promise<LocalModel[]> {
    const res = await fetch(`${normalizedBase}/v1/models`, {
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as OpenAIModelsResponse
    return data.data.map((m) => ({
      id: m.id,
      name: m.id,
      providerId: instanceId,
      sizeBytes: 0,
      type: 'llm' as const,
      loadedInstances: [],
      meta: m.owned_by ? ({ owned_by: m.owned_by } as Record<string, string>) : {}
    }))
  }

  async function chat(modelId: string, request: ChatRequest): Promise<ChatResponse> {
    const messages: { role: string; content: string }[] = []

    if (request.system_prompt) {
      messages.push({ role: 'system', content: request.system_prompt })
    }

    if (typeof request.input === 'string') {
      messages.push({ role: 'user', content: request.input })
    } else {
      const text = request.input
        .filter((item) => item.type === 'message')
        .map((item) => (item as { type: 'message'; content: string }).content)
        .join('\n')
      messages.push({ role: 'user', content: text })
    }

    const body: Record<string, unknown> = { model: modelId, messages }
    if (request.temperature !== undefined) body.temperature = request.temperature
    if (request.top_p !== undefined) body.top_p = request.top_p
    if (request.max_output_tokens !== undefined) body.max_tokens = request.max_output_tokens

    console.log('[custom] chat body:', JSON.stringify(body, null, 2))
    const res = await fetch(`${normalizedBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as OpenAIChatResponse

    const content = data.choices[0]?.message?.content ?? ''
    const usage = data.usage

    return {
      model_instance_id: data.id,
      output: [{ type: 'message', content }],
      stats: {
        input_tokens: usage?.prompt_tokens ?? 0,
        total_output_tokens: usage?.completion_tokens ?? 0,
        reasoning_output_tokens: 0,
        tokens_per_second: 0,
        time_to_first_token_seconds: 0
      }
    }
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
