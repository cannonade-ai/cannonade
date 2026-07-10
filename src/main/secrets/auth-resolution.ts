import {
  defaultEnvVarName,
  type ConfiguredProvider,
  type ProviderType
} from '@shared/provider/configured-provider'
import type { ProbeAuth } from '@shared/provider/api-key'

export interface SecretSources {
  env: Record<string, string | undefined>
  store: Record<string, string>
}

export function resolveApiKey(
  provider: ConfiguredProvider,
  sources: SecretSources
): string | undefined {
  if (provider.authMethod === 'stored') return sources.store[provider.instanceId]
  if (provider.authMethod === 'env') {
    return sources.env[provider.envVarName ?? defaultEnvVarName(provider.type)]
  }
  return undefined
}

export function resolveProbeApiKey(
  type: ProviderType,
  auth: ProbeAuth | undefined,
  sources: SecretSources
): string | undefined {
  if (auth?.authMethod === 'stored') {
    return auth.instanceId ? sources.store[auth.instanceId] : undefined
  }
  if (auth?.authMethod === 'env') {
    return sources.env[auth.envVarName ?? defaultEnvVarName(type)]
  }
  return undefined
}
