import type { LLMProvider } from './base'
import type { Model } from '@shared/lm-studio/ipc-contracts'

const API_BASE = 'http://127.0.0.1:1234'

export const lmStudioProvider: LLMProvider = {
  async fetchModels(): Promise<Model[]> {
    const res = await fetch(`${API_BASE}/api/v1/models`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as { models: Model[] }
    return data.models
  }
}
