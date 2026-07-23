import type {
  ListResponse,
  Message,
  ProgressResponse,
  ChatResponse as OllamaChatResponse,
  ChatRequest as OllamaChatRequest
} from 'ollama'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, OutputItem } from '@shared/provider/chat'
import type { DownloadStatusResponse } from '@shared/provider/ipc-contracts'
import type { ModelResponse } from './types'

type OllamaModel = ListResponse['models'][number]

export function toLocalModel(
  m: OllamaModel,
  psModels: OllamaModel[],
  instanceId: string
): LocalModel {
  const loadedInstance = psModels.find((p) => p.name === m.name) as ModelResponse | undefined
  const meta: Record<string, string | number> = {}
  if (m.details.family) meta.family = m.details.family
  if (m.details.parameter_size) meta.params_string = m.details.parameter_size
  if (m.details.quantization_level) meta.quantization = m.details.quantization_level
  if (m.details.format) meta.format = m.details.format

  const parts = m.name.split('/')
  let displayName = m.name
  if (parts.length === 3) {
    meta.publisher = parts[1]
    displayName = parts[2].split(':')[0]
  }

  return {
    id: m.name,
    name: displayName,
    providerId: instanceId,
    sizeBytes: m.size,
    type: m.name.includes('embed') ? 'embedding' : 'llm',
    loadedInstances: loadedInstance
      ? [{ id: loadedInstance.name, config: { context_length: loadedInstance.context_length } }]
      : [],
    meta
  }
}

function toChatMessages(request: ChatRequest): Message[] {
  if (request.messages?.length) {
    const messages: Message[] = request.messages.map((m) => ({ ...m }))
    if (request.system_prompt && !request.messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.system_prompt })
    }
    return messages
  }

  const messages: Message[] = []

  if (request.system_prompt) {
    messages.push({ role: 'system', content: request.system_prompt })
  }

  if (typeof request.input === 'string') {
    messages.push({ role: 'user', content: request.input })
  } else {
    const text = (request.input ?? [])
      .filter((item) => item.type === 'message')
      .map((item) => (item as { type: 'message'; content: string }).content)
      .join('\n')
    messages.push({ role: 'user', content: text })
  }

  return messages
}

export function toChatRequest(request: ChatRequest): OllamaChatRequest & { stream: true } {
  return {
    model: request.model,
    messages: toChatMessages(request),
    stream: true,
    options: {
      temperature: request.temperature,
      top_p: request.top_p,
      top_k: request.top_k,
      repeat_penalty: request.repeat_penalty,
      presence_penalty: request.presence_penalty,
      frequency_penalty: request.frequency_penalty,
      seed: request.seed,
      num_predict: request.max_output_tokens
    }
  }
}

export function toChatResponse(
  finalChunk: OllamaChatResponse,
  content: string,
  thinking: string
): ChatResponse {
  const output: OutputItem[] = []
  if (thinking) {
    output.push({ type: 'reasoning', content: thinking })
  }
  output.push({ type: 'message', content })

  return {
    model_instance_id: finalChunk.model,
    output,
    stats: {
      input_tokens: finalChunk.prompt_eval_count,
      total_output_tokens: finalChunk.eval_count,
      reasoning_output_tokens: 0,
      tokens_per_second: finalChunk.eval_count / (finalChunk.eval_duration / 1e9),
      time_to_first_token_ms: finalChunk.prompt_eval_duration / 1e6
    }
  }
}

export function toDownloadProgress(jobId: string, chunk: ProgressResponse): DownloadStatusResponse {
  return {
    job_id: jobId,
    status: 'downloading',
    downloaded_bytes: chunk.completed,
    total_size_bytes: chunk.total
  }
}
