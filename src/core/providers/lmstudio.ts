import type { LLMProvider } from './base'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

const API_BASE = 'http://localhost:1234'

export const lmStudioProvider: LLMProvider = {
  async fetchModels(): Promise<Model[]> {
    const res = await fetch(`${API_BASE}/api/v1/models`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as { models: Model[] }
    return data.models
  },

  async chat(request: ChatRequest, apiToken?: string): Promise<ChatResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`

    const res = await fetch(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    return res.json() as Promise<ChatResponse>
  }
}
