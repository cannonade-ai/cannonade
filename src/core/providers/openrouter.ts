import type { LLMProvider } from './base'
import type { ExternalModel } from '@shared/provider/external-model'
import type { Model } from '@shared/open-router/ipc-contracts'

function mapToExternalModel(instanceId: string, model: Model): ExternalModel {
  return {
    id: model.id,
    name: model.name,
    providerId: instanceId,
    contextLength: model.context_length,
    meta: {
      canonical_slug: model.canonical_slug,
      created: model.created,
      description: model.description,
      architecture: model.architecture,
      pricing: model.pricing,
      top_provider: model.top_provider,
      supported_parameters: model.supported_parameters
    }
  }
}

export function createOpenRouterProvider(instanceId: string, baseUrl: string): LLMProvider {
  const normalizedBase = baseUrl.replace(/\/$/, '')

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
      const res = await fetch(`${normalizedBase}/models`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = (await res.json()) as { data: Model[] }
      return data.data.map((m) => mapToExternalModel(instanceId, m))
    }
  }
}
