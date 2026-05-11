import type { ExternalProviderId } from './ids'

export interface ExternalModel {
  id: string
  name: string
  providerId: ExternalProviderId
  contextLength: number
  meta: Record<string, unknown>
}
