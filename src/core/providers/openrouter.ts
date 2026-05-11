import type { LLMProvider } from './base'
import type { ExternalModel } from '@shared/provider/external-model'
import type { Model } from '@shared/open-router/ipc-contracts'
import type { ChatResponse } from '@shared/lm-studio/chat'

const API_BASE = 'http://localhost:3000'

function mapToExternalModel(model: Model): ExternalModel {
  return {
    id: model.id,
    name: model.name,
    providerId: 'openrouter',
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

export const openRouterProvider: LLMProvider = {
  id: 'openrouter',

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
    const res = await fetch(`${API_BASE}/api/v1/models`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as { data: Model[] }
    return data.data.map(mapToExternalModel)
  },

  async chat(): Promise<ChatResponse> {
    throw new Error('not implemented')
  }
}
