export interface Model {
  id: string
  object: string
  created?: number
  owned_by?: string
  shutdown_date?: string | null
}

export interface ModelListResponse {
  object: string
  data: Model[]
}

export interface PromptTokensDetails {
  cached_tokens?: number
  audio_tokens?: number
}

export interface CompletionTokensDetails {
  reasoning_tokens?: number
  audio_tokens?: number
  accepted_prediction_tokens?: number
  rejected_prediction_tokens?: number
}

export interface Usage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: PromptTokensDetails
  completion_tokens_details?: CompletionTokensDetails
}

export interface ResponseMessage {
  role: string
  content: string | null
  refusal?: string | null
}

export interface ChatChoice {
  index: number
  message: ResponseMessage
  finish_reason: string
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: ChatChoice[]
  usage?: Usage
}

export interface ErrorBody {
  message?: string
  type?: string
  param?: string | null
  code?: string | null
}

export interface ErrorResponse {
  error?: ErrorBody
}
