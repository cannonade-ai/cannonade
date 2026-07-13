import type { OpenAIChatRequest, OpenAIUsage } from '../openai-compat/types'

export interface ModelArchitecture {
  modality: string
  input_modalities: string[]
  output_modalities: string[]
  tokenizer: string
  instruct_type: string | null
}

export interface ModelPricingOverride {
  min_prompt_tokens: number
  prompt: string
  completion: string
  input_cache_read?: string
  input_cache_write?: string
}

export interface ModelPricing {
  prompt: string
  completion: string
  request?: string
  image?: string
  web_search?: string
  input_cache_read?: string
  input_cache_write?: string
  overrides?: ModelPricingOverride[]
}

export interface ModelTopProvider {
  context_length: number | null
  max_completion_tokens: number | null
  is_moderated: boolean
}

export interface ModelDefaultParameters {
  temperature: number | null
  top_p: number | null
  top_k: number | null
  frequency_penalty: number | null
  presence_penalty: number | null
  repetition_penalty: number | null
}

export interface ModelLinks {
  details: string
}

export interface ModelReasoning {
  mandatory: boolean
  default_enabled: boolean
  supported_efforts: string[]
  default_effort: string | null
}

export interface Model {
  id: string
  canonical_slug: string
  hugging_face_id: string | null
  name: string
  created: number
  description: string | null
  context_length: number | null
  architecture: ModelArchitecture
  pricing: ModelPricing
  top_provider: ModelTopProvider | null
  per_request_limits: Record<string, string> | null
  supported_parameters: string[]
  default_parameters: ModelDefaultParameters | null
  supported_voices: string[] | null
  knowledge_cutoff: string | null
  expiration_date: string | null
  links: ModelLinks | null
  reasoning: ModelReasoning | null
}

export interface ModelListResponse {
  data: Model[]
}

export interface ErrorResponse {
  error?: {
    code: number
    message: string
  }
}

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high'

export interface ReasoningConfig {
  effort: ReasoningEffort
}

export interface ChatCompletionRequest extends OpenAIChatRequest {
  reasoning?: ReasoningConfig
}

export interface ChatCompletionMessage {
  role: string
  content: string | null
  refusal?: string | null
  reasoning?: string | null
}

export interface ChatCompletionChoice {
  index: number
  message: ChatCompletionMessage
  finish_reason: string | null
}

export interface UsageCostDetails {
  upstream_inference_prompt_cost?: number
  upstream_inference_completions_cost?: number
}

export interface PromptTokensDetails {
  cached_tokens?: number
}

export interface CompletionTokensDetails {
  reasoning_tokens?: number
}

export interface ChatCompletionUsage extends OpenAIUsage {
  cost?: number
  cost_details?: UsageCostDetails
  prompt_tokens_details?: PromptTokensDetails
  completion_tokens_details?: CompletionTokensDetails
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage?: ChatCompletionUsage
}
