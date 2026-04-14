export interface ModelQuantization {
  name: string | null
  bits_per_weight: number | null
}

export interface LoadedInstanceConfig {
  context_length: number
  eval_batch_size?: number
  flash_attention?: boolean
  num_experts?: number
  offload_kv_cache_to_gpu?: boolean
}

export interface LoadedInstance {
  id: string
  config: LoadedInstanceConfig
}

export interface ModelCapabilities {
  vision: boolean
  trained_for_tool_use: boolean
}

export interface Model {
  type: 'llm' | 'embedding'
  publisher: string
  key: string
  display_name: string
  architecture?: string | null
  quantization: ModelQuantization | null
  size_bytes: number
  params_string: string | null
  loaded_instances: LoadedInstance[]
  max_context_length: number
  format: 'gguf' | 'mlx' | null
  capabilities?: ModelCapabilities
  description?: string | null
}

export type FetchModelsResult = Model[]
