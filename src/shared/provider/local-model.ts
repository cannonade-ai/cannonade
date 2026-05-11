import type { LocalProviderId } from './ids'

export interface LoadedInstance {
  id: string
  config?: { context_length?: number }
}

export interface LocalModel {
  id: string
  name: string
  providerId: LocalProviderId
  sizeBytes: number
  type: 'llm' | 'embedding'
  loadedInstances: LoadedInstance[]
  capabilities?: { vision: boolean; trained_for_tool_use: boolean }
  maxContextLength?: number
  meta: Record<string, string | number>
}
