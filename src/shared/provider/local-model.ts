import type { LocalProviderId } from './ids'

export interface LocalModel {
  id: string
  name: string
  providerId: LocalProviderId
  sizeBytes: number
  meta: Record<string, unknown>
}
