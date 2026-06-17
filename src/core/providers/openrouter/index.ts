import type { LLMProvider } from '../base'
import type { ExternalModel } from '@shared/provider/external-model'
import { authHeader } from '@shared/provider/api-key'
import { toExternalModel } from './mappers'
import { ModelListResponse } from './types'

export function createOpenRouterProvider(
  instanceId: string,
  baseUrl: string,
  apiKey?: string
): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const auth = authHeader(apiKey)

  return {
    id: instanceId,

    capabilities: {
      chat: false,
      localModels: false,
      externalModels: true,
      downloadModel: false,
      downloadStatus: false,
      deleteModel: false,
      loadModel: false,
      serverControl: false,
      requiresApiKey: true
    },

    async fetchExternalModels(): Promise<ExternalModel[]> {
      const res = await fetch(`${normalizedBase}/models`, { headers: { ...auth } })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = (await res.json()) as ModelListResponse
      return data.data.map((m) => toExternalModel(m, instanceId))
    }
  }
}
