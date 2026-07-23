import type { OpenAIChatMessage, OpenAIChatRequest, OpenAIChatResponse } from './types'
import type { ChatRequest, ChatResponse, TextInput } from '@shared/provider/chat'

function toChatMessages(request: ChatRequest): OpenAIChatMessage[] {
  if (request.messages?.length) {
    const messages: OpenAIChatMessage[] = request.messages.map((m) => ({ ...m }))
    if (request.system_prompt && !request.messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.system_prompt })
    }
    return messages
  }

  const messages: OpenAIChatMessage[] = []

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

export function toChatRequest(request: ChatRequest): OpenAIChatRequest {
  return {
    model: request.model,
    messages: toChatMessages(request),
    stream: request.stream,
    temperature: request.temperature,
    top_p: request.top_p,
    top_k: request.top_k,
    max_tokens: request.max_output_tokens,
    presence_penalty: request.presence_penalty,
    frequency_penalty: request.frequency_penalty,
    repeat_penalty: request.repeat_penalty,
    seed: request.seed
  }
}

export function toChatResponse(response: OpenAIChatResponse): ChatResponse {
  return {
    model_instance_id: response.id,
    output: [{ type: 'message', content: response.choices[0]?.message?.content ?? '' }],
    stats: {
      input_tokens: response.usage?.prompt_tokens ?? 0,
      total_output_tokens: response.usage?.completion_tokens ?? 0,
      reasoning_output_tokens: 0,
      tokens_per_second: 0,
      time_to_first_token_ms: 0
    }
  }
}
