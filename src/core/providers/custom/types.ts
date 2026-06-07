export interface OpenAIChatMessage {
  role: string
  content: string
}

export interface OpenAIChatRequest {
  model: string
  messages: OpenAIChatMessage[]
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  repeat_penalty?: number
  seed?: number
}

export interface OpenAIModel {
  id: string
  object: string
  owned_by?: string
}

export interface OpenAIModelsResponse {
  data: OpenAIModel[]
}

export interface OpenAIChatResponse {
  id: string
  choices: {
    message: { role: string; content: string }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}
