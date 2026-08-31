import type { OpenAIChatRequest, OpenAIChatResponse } from '../openai-compat/types'

export interface UnslothValidationDetail {
  msg?: string
  type?: string
}

export interface UnslothErrorBody {
  detail?: string | UnslothValidationDetail[]
  error?: { message?: string; type?: string; code?: string }
}

export interface UnslothModel {
  id: string
  object?: string
  created?: number
  owned_by?: string
  loaded?: boolean
  quant?: string
  display_name?: string
  context_length?: number | null
  max_context_length?: number | null
  native_context_length?: number | null
}

export interface UnslothModelsResponse {
  object?: string
  data: UnslothModel[]
}

export interface UnslothLocalModel {
  id: string
  display_name?: string
  path?: string
  source?: string
  model_id?: string
  active_cache?: boolean | null
  partial?: boolean
  model_format?: string | null
  updated_at?: number
  task?: string | null
  audio_type?: string | null
}

export interface UnslothLocalModelsResponse {
  models_dir?: string
  hf_cache_dir?: string
  lmstudio_dirs?: string[]
  models: UnslothLocalModel[]
}

export interface UnslothInferenceParams {
  temperature?: number
  top_p?: number
  top_k?: number
  min_p?: number
  presence_penalty?: number
  trust_remote_code?: boolean
}

export interface UnslothInferenceStatus {
  is_vision?: boolean
  is_audio?: boolean
  context_length?: number | null
  max_context_length?: number | null
  native_context_length?: number | null
  supports_reasoning?: boolean
  supports_tools?: boolean
  is_mlx?: boolean
  n_layers?: number | null
  active_model?: string | null
  model_identifier?: string | null
  is_gguf?: boolean
  is_local_model?: boolean
  gguf_variant?: string | null
  loading?: string[]
  loaded?: string[]
  inference?: UnslothInferenceParams | null
  requested_context_length?: number | null
}

export interface UnslothHealthResponse {
  status?: string
  service?: string
  chat_only?: boolean
  studio_root_id?: string
  version?: string
  studio_version?: string
  device_type?: string
}

export interface UnslothLoadRequest {
  model_path: string
  gguf_variant?: string
  force_reload?: boolean
}

export interface UnslothLoadResponse {
  status?: string
  model?: string
  display_name?: string
  is_gguf?: boolean
  memory_warning?: string | null
}

export interface UnslothUnloadRequest {
  model_path: string
  force_cancel_active?: boolean
}

export interface UnslothUnloadResponse {
  status?: string
  model?: string
}

export interface UnslothDownloadRequest {
  repo_id: string
  gguf_variant?: string
  transport_mode?: string
}

export interface UnslothDownloadStartResponse {
  job_key?: string
  state?: string
  accepted?: boolean
  attached?: boolean
  generation?: number
  transport?: string
}

export interface UnslothDownloadJobStatus {
  state?: string
  error?: string | null
  generation?: number
}

export interface UnslothDownloadProgress {
  downloaded_bytes?: number
  completed_bytes?: number
  complete_on_disk?: boolean
  expected_bytes?: number
  progress?: number
  cache_path?: string
  cache_measured?: boolean
  target_present?: boolean | null
}

export interface UnslothDeleteRequest {
  repo_id: string
  variant?: string
}

export interface UnslothChatRequest extends OpenAIChatRequest {
  min_p?: number
}

export interface UnslothCompletionTokensDetails {
  reasoning_tokens?: number
}

export interface UnslothPromptTokensDetails {
  cached_tokens?: number
}

export interface UnslothUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: UnslothPromptTokensDetails
  completion_tokens_details?: UnslothCompletionTokensDetails
}

export interface UnslothResponseMessage {
  role?: string
  content?: string | null
  reasoning_content?: string | null
}

export interface UnslothChatChoice {
  index?: number
  message?: UnslothResponseMessage
  finish_reason?: string
}

export interface UnslothChatResponse extends Omit<OpenAIChatResponse, 'choices' | 'usage'> {
  created?: number
  choices: UnslothChatChoice[]
  usage?: UnslothUsage
}
