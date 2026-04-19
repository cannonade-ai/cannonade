import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

export interface LLMProvider {
  fetchModels(): Promise<Model[]>
  chat(request: ChatRequest, apiToken?: string): Promise<ChatResponse>
}
