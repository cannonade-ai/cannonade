export const KNOWN_PROVIDER_DEFAULTS = {
  lmstudio: {
    displayName: 'LM Studio',
    description: 'Local or remote LM Studio server',
    defaultUrl: 'http://localhost:1234',
    singleton: false,
    supportsRemote: true,
    isExternal: false,
    requiresApiKey: false,
    apiKeyEnvNames: ['LMSTUDIO_API_KEY', 'LM_API_TOKEN']
  },
  ollama: {
    displayName: 'Ollama',
    description: 'Local or remote Ollama server',
    defaultUrl: 'http://localhost:11434',
    singleton: false,
    supportsRemote: true,
    isExternal: false,
    requiresApiKey: false,
    apiKeyEnvNames: ['OLLAMA_API_KEY']
  },
  custom: {
    displayName: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
    defaultUrl: '',
    singleton: false,
    supportsRemote: false,
    isExternal: false,
    requiresApiKey: false,
    apiKeyEnvNames: ['CUSTOM_API_KEY']
  },
  openrouter: {
    displayName: 'OpenRouter',
    description: 'Access hundreds of models via OpenRouter',
    defaultUrl: 'https://openrouter.ai/api/v1',
    singleton: true,
    supportsRemote: false,
    isExternal: true,
    requiresApiKey: true,
    apiKeyEnvNames: ['OPENROUTER_API_KEY']
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
