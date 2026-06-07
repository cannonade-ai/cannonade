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
