export const KNOWN_PROVIDER_DEFAULTS = {
  lmstudio: {
    displayName: 'LM Studio',
    description: 'Local or remote LM Studio server',
    defaultUrl: 'http://localhost:1234',
    singleton: false,
    supportsRemote: true,
    isExternal: false,
    requiresApiKey: false,
    defaultEnvVar: 'LMSTUDIO_API_KEY'
  },
  ollama: {
    displayName: 'Ollama',
    description: 'Local or remote Ollama server',
    defaultUrl: 'http://localhost:11434',
    singleton: false,
    supportsRemote: true,
    isExternal: false,
    requiresApiKey: false,
    defaultEnvVar: 'OLLAMA_API_KEY'
  },
  custom: {
    displayName: 'Custom',
    description: 'Any OpenAI-compatible local API endpoint',
    defaultUrl: 'http://localhost:8080',
    singleton: false,
    supportsRemote: false,
    isExternal: false,
    requiresApiKey: false,
    defaultEnvVar: 'CUSTOM_API_KEY'
  },
  openrouter: {
    displayName: 'OpenRouter',
    description: 'Access hundreds of models via OpenRouter',
    defaultUrl: 'https://openrouter.ai/api/v1',
    singleton: true,
    supportsRemote: false,
    isExternal: true,
    requiresApiKey: true,
    defaultEnvVar: 'OPENROUTER_API_KEY'
  },
  vercel: {
    displayName: 'Vercel',
    description: 'Access hundreds of models via Vercel AI Gateway',
    defaultUrl: 'https://ai-gateway.vercel.sh',
    singleton: true,
    supportsRemote: false,
    isExternal: true,
    requiresApiKey: true,
    defaultEnvVar: 'VERCEL_API_KEY'
  }
} as const

export type ProviderType = keyof typeof KNOWN_PROVIDER_DEFAULTS

export type ProviderAuthMethod = 'none' | 'env' | 'stored'

export interface ConfiguredProvider {
  instanceId: string
  type: ProviderType
  displayName: string
  url: string
  isDefault: boolean
  isRemote?: boolean
  authMethod?: ProviderAuthMethod
  envVarName?: string
}

export function defaultEnvVarName(type: ProviderType): string {
  return KNOWN_PROVIDER_DEFAULTS[type].defaultEnvVar
}
