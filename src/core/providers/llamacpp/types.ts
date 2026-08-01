import type { OpenAIChatRequest, OpenAIChatResponse } from '../openai-compat/types'

export interface LlamaCppErrorBody {
  error?: {
    code?: number
    message?: string
    type?: string
  }
}

export interface LlamaCppDownloadProgress {
  done: number
  total: number
}

export interface LlamaCppModelStatus {
  value: string
  args?: string[]
  preset?: string
  failed?: boolean
  exit_code?: number
  progress?: Record<string, LlamaCppDownloadProgress>
}

export interface LlamaCppModelArchitecture {
  input_modalities?: string[]
  output_modalities?: string[]
}

export interface LlamaCppModelMeta {
  vocab_type?: number
  n_vocab?: number
  n_ctx_train?: number
  n_embd?: number
  n_params?: number
  size?: number
}

export interface LlamaCppRouterModel {
  id: string
  aliases?: string[]
  tags?: string[]
  object?: string
  owned_by?: string
  created?: number
  path?: string
  status?: LlamaCppModelStatus
  architecture?: LlamaCppModelArchitecture
  meta?: LlamaCppModelMeta | null
  source?: string
  can_remove?: boolean
}

export interface LlamaCppRouterModelsResponse {
  object?: string
  data: LlamaCppRouterModel[]
}

export interface LlamaCppOpenAIModel {
  id: string
  object?: string
  created?: number
  owned_by?: string
  meta?: LlamaCppModelMeta | null
}

export interface LlamaCppOpenAIModelsResponse {
  object?: string
  data: LlamaCppOpenAIModel[]
}

export interface LlamaCppSuccessResponse {
  success: boolean
}

export interface LlamaCppChatRequest extends OpenAIChatRequest {
  min_p?: number
  n_predict?: number
  reasoning_effort?: string
  timings_per_token?: boolean
}

export interface LlamaCppTimings {
  cache_n?: number
  prompt_n?: number
  prompt_ms?: number
  prompt_per_token_ms?: number
  prompt_per_second?: number
  predicted_n?: number
  predicted_ms?: number
  predicted_per_token_ms?: number
  predicted_per_second?: number
}

export interface LlamaCppPromptTokensDetails {
  cached_tokens?: number
}

export interface LlamaCppUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: LlamaCppPromptTokensDetails
}

export interface LlamaCppResponseMessage {
  role?: string
  content?: string | null
  reasoning_content?: string | null
}

export interface LlamaCppChatChoice {
  message?: LlamaCppResponseMessage
  finish_reason?: string
}

export interface LlamaCppChatResponse extends Omit<OpenAIChatResponse, 'choices' | 'usage'> {
  choices: LlamaCppChatChoice[]
  usage?: LlamaCppUsage
  timings?: LlamaCppTimings
}

export interface LlamaCppSseEvent {
  model?: string
  event?: string
  data?: Record<string, unknown>
}
