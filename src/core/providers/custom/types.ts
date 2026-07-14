export interface OpenAIModel {
  id: string
  object: string
  owned_by?: string
}

export interface OpenAIModelsResponse {
  data: OpenAIModel[]
}
