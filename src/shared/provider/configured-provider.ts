export type KnownProviderType = 'lmstudio' | 'ollama'
export type ProviderType = KnownProviderType | 'custom'

export interface ConfiguredProvider {
  instanceId: string
  type: ProviderType
  displayName: string
  url: string
  isDefault: boolean
  lmStudioRemote?: boolean
}

export const KNOWN_PROVIDER_DEFAULTS: Record<KnownProviderType, { displayName: string; url: string }> = {
  lmstudio: { displayName: 'LM Studio', url: 'http://localhost:1234' },
  ollama: { displayName: 'Ollama', url: 'http://127.0.0.1:11434' }
}
