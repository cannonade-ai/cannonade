import type { ProviderAuthMethod } from './configured-provider'

export interface SecretInfo {
  envVarExists: boolean
  maskedEnvValue: string | null
  storedKeyExists: boolean
  maskedStoredKey: string | null
}

export interface ProbeAuth {
  authMethod: ProviderAuthMethod
  envVarName?: string
  instanceId?: string
}

export function authHeader(apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}
