import type { ModelMessage } from 'ai'

export interface GatewayModelPricing {
  input?: string
  output?: string
  input_cache_read?: string
  input_cache_write?: string
  image?: string
  web_search?: string
}

export interface GatewayModelModalities {
  input?: string[]
  output?: string[]
}

export interface GatewayModel {
  id: string
  object: string
  created?: number
  released?: number
  owned_by?: string
  name: string
  description?: string
  context_window?: number
  max_tokens?: number
  type?: string
  tags?: string[]
  modalities?: GatewayModelModalities
  supported_parameters?: string[]
  knowledge?: string
  pricing?: GatewayModelPricing
}

export interface GatewayModelListResponse {
  object: string
  data: GatewayModel[]
}

export interface GatewayErrorResponse {
  error?: {
    message?: string
    type?: string
  }
}

export interface GatewayChatPrompt {
  instructions?: string
  messages: ModelMessage[]
}

export interface StreamedChatResult {
  text: string
  reasoningText: string
  modelId: string
  inputTokens: number | undefined
  outputTokens: number | undefined
  reasoningTokens: number | undefined
  cachedInputTokens: number | undefined
  requestStartedAt: number
  firstTokenAt: number | undefined
  streamEndedAt: number
}
