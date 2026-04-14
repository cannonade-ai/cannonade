import type { Model } from '@shared/open-router/ipc-contracts'

const API_BASE = 'http://localhost:3000'

export const openRouterProvider = {
  async fetchModels(): Promise<Model[]> {
    const res = await fetch(`${API_BASE}/api/v1/models`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as { data: Model[] }
    return data.data
  }
}
