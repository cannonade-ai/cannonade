import type { Model } from './types'
import type { ExternalModel } from '@shared/provider/external-model'

export function toExternalModel(m: Model, instanceId: string): ExternalModel {
  return {
    id: m.id,
    name: m.name,
    providerId: instanceId,
    contextLength: m.context_length,
    meta: {
      canonical_slug: m.canonical_slug,
      created: m.created,
      description: m.description,
      architecture: m.architecture,
      pricing: m.pricing,
      top_provider: m.top_provider,
      supported_parameters: m.supported_parameters
    }
  }
}
