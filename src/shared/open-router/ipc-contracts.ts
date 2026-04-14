export interface ModelArchitecture {
  input_modalities: string[]
  output_modalities: string[]
  modality: string
  instruct_type: string | null
  tokenizer: string
}

export interface ModelPricing {
  prompt: string
  completion: string
  image: string
  request: string
}

export interface ModelTopProvider {
  is_moderated: boolean
  context_length: number
  max_completion_tokens: number | null
}

export interface Model {
  id: string
  name: string
  canonical_slug: string
  context_length: number
  created: number
  description: string | null
  architecture: ModelArchitecture
  pricing: ModelPricing
  top_provider: ModelTopProvider
  supported_parameters: string[]
}
