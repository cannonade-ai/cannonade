export interface ModelDetails {
  parent_model: string
  format: string
  family: string
  families: string[]
  parameter_size: string
  quantization_level: string
}

export interface ModelResponse {
  name: string
  modified_at: Date
  model: string
  size: number
  digest: string
  details: ModelDetails
  expires_at: Date
  size_vram: number
  context_length: number
}
