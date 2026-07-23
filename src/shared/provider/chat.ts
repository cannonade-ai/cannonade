export interface TextInput {
  type: 'message'
  content: string
}

export interface ImageInput {
  type: 'image'
  data_url: string
}

export type InputItem = TextInput | ImageInput

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PluginIntegration {
  type: 'plugin'
  id: string
  allowed_tools?: string[]
}

export interface EphemeralMcpIntegration {
  type: 'ephemeral_mcp'
  server_label: string
  server_url: string
  allowed_tools?: string[]
  headers?: Record<string, string>
}

export type Integration = string | PluginIntegration | EphemeralMcpIntegration

export interface ChatRequest {
  model: string
  input?: string | InputItem[]
  messages?: ChatMessage[]
  system_prompt?: string
  integrations?: Integration[]
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
  min_p?: number
  repeat_penalty?: number
  frequency_penalty?: number
  presence_penalty?: number
  seed?: number
  max_output_tokens?: number
  reasoning?: 'off' | 'low' | 'medium' | 'high' | 'on'
  context_length?: number
  store?: boolean
  previous_response_id?: string
}

export interface MessageOutput {
  type: 'message'
  content: string
}

export interface ToolProviderInfo {
  type: 'plugin' | 'ephemeral_mcp'
  plugin_id?: string
  server_label?: string
}

export interface ToolCallOutput {
  type: 'tool_call'
  tool: string
  arguments: Record<string, unknown>
  output: string
  provider_info: ToolProviderInfo
}

export interface ReasoningOutput {
  type: 'reasoning'
  content: string
}

export interface InvalidToolCallMetadata {
  type: 'invalid_name' | 'invalid_arguments'
  tool_name: string
  arguments?: Record<string, unknown>
  provider_info?: ToolProviderInfo
}

export interface InvalidToolCallOutput {
  type: 'invalid_tool_call'
  reason: string
  metadata: InvalidToolCallMetadata
}

export type OutputItem = MessageOutput | ToolCallOutput | ReasoningOutput | InvalidToolCallOutput

export interface ChatCostDetails {
  upstream_inference_prompt_cost?: number
  upstream_inference_completions_cost?: number
}

export interface ChatStats {
  input_tokens: number
  total_output_tokens: number
  reasoning_output_tokens: number
  tokens_per_second: number
  time_to_first_token_ms: number
  model_load_time_seconds?: number
  cached_input_tokens?: number
  cost?: number
  cost_details?: ChatCostDetails
}

export interface ChatResponse {
  model_instance_id: string
  output: OutputItem[]
  stats: ChatStats
  response_id?: string
}

export interface ChatOptions {
  abortSignal?: AbortSignal
}
