export const KNOWN_PROVIDER_DEFAULTS = {
  lmstudio: {
    displayName: 'LM Studio',
    description: 'Local or remote LM Studio server',
    defaultUrl: 'http://localhost:1234',
    singleton: true,
    supportsRemote: true,
    isExternal: false
  },
  ollama: {
    displayName: 'Ollama',
    description: 'Local or remote Ollama server',
    defaultUrl: 'http://localhost:11434',
    singleton: true,
    supportsRemote: true,
    isExternal: false
  },
  custom: {
    displayName: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
    defaultUrl: '',
    singleton: false,
    supportsRemote: false,
    isExternal: false
  },
  openrouter: {
    displayName: 'OpenRouter',
    description: 'Access hundreds of models via OpenRouter',
    defaultUrl: 'https://openrouter.ai/api/v1',
    singleton: true,
    supportsRemote: false,
    isExternal: true
  }
} as const

export type ProviderType = keyof typeof KNOWN_PROVIDER_DEFAULTS

export interface ConfiguredProvider {
  instanceId: string
  type: ProviderType
  displayName: string
  url: string
  isDefault: boolean
  isRemote?: boolean
}
