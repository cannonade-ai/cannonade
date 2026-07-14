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

export interface OpenAIResponseMessage {
  role: string
  content: string
}

export interface OpenAIChatChoice {
  message: OpenAIResponseMessage
  finish_reason: string
}

export interface OpenAIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface OpenAIChatResponse {
  id: string
  choices: OpenAIChatChoice[]
  usage?: OpenAIUsage
  model: string
}
