import type { OpenAIModel } from './types'
import type { LocalModel } from '@shared/provider/local-model'

export function toLocalModel(m: OpenAIModel, instanceId: string): LocalModel {
  return {
    id: m.id,
    name: m.id,
    providerId: instanceId,
    sizeBytes: 0,
    type: 'llm',
    loadedInstances: [],
    meta: m.owned_by ? { owned_by: m.owned_by } : {}
  }
}
