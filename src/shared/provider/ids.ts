export const LOCAL_PROVIDERS = {
  lmstudio: 'lmstudio',
  ollama: 'ollama'
} as const

export const EXTERNAL_PROVIDERS = {
  openrouter: 'openrouter'
} as const

export type LocalProviderId = (typeof LOCAL_PROVIDERS)[keyof typeof LOCAL_PROVIDERS]
export type ExternalProviderId = (typeof EXTERNAL_PROVIDERS)[keyof typeof EXTERNAL_PROVIDERS]
export type ProviderId = LocalProviderId | ExternalProviderId
