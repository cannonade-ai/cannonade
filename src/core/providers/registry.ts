import type { LLMProvider } from './base'
import {
  KNOWN_PROVIDER_DEFAULTS,
  type ConfiguredProvider,
  type ProviderType
} from '@shared/provider/configured-provider'
import { getSecret } from '../../main/secrets/secret-store'
import { createLogger } from '../../main/logger'

const log = createLogger('provider-registry')

type ProviderFactory = (
  instanceId: string,
  url: string,
  apiKey?: string,
  remote?: boolean
) => LLMProvider

const registry = new Map<string, LLMProvider>()
const factories = new Map<string, ProviderFactory>()

export function registerProviderFactory(type: string, factory: ProviderFactory): void {
  factories.set(type, factory)
}

export function createProbeProvider(type: ProviderType, url: string): LLMProvider {
  const factory = factories.get(type) ?? factories.get('custom')
  if (!factory) throw new Error(`No factory registered for provider type: ${type}`)
  return factory('__probe__', url, getSecret(KNOWN_PROVIDER_DEFAULTS[type].apiKeyEnvNames), false)
}

function validateProvider(id: string, p: LLMProvider): void {
  const miss = (method: string): never => {
    throw new Error(`Provider "${id}" is missing method: ${method}`)
  }
  const c = p.capabilities
  if (c.chat && !p.chat) miss('chat')
  if (c.localModels && !p.fetchLocalModels) miss('fetchLocalModels')
  if (c.externalModels && !p.fetchExternalModels) miss('fetchExternalModels')
  if (c.downloadModel && !p.downloadModel) miss('downloadModel')
  if (c.downloadStatus && !p.getDownloadStatus) miss('getDownloadStatus')
  if (c.deleteModel && !p.deleteModel) miss('deleteModel')
  if (c.loadModel && !p.loadModel) miss('loadModel')
  if (c.serverControl && !p.getServerStatus) miss('getServerStatus')
  if (c.serverControl && !p.startServer) miss('startServer')
  if (c.serverControl && !p.stopServer) miss('stopServer')
}

export function buildRegistry(configuredProviders: ConfiguredProvider[]): void {
  registry.clear()

  for (const providerConfig of configuredProviders) {
    const factory = factories.get(providerConfig.type) ?? factories.get('custom')
    if (!factory) throw new Error(`No factory registered for provider type: ${providerConfig.type}`)
    const provider = factory(
      providerConfig.instanceId,
      providerConfig.url,
      getSecret(KNOWN_PROVIDER_DEFAULTS[providerConfig.type].apiKeyEnvNames),
      providerConfig.isRemote ?? false
    )
    validateProvider(providerConfig.instanceId, provider)
    registry.set(providerConfig.instanceId, provider)
  }
  log.debug(`Provider registry built with ${registry.size} provider(s)`)
  log.debug(
    'Configured providers:',
    configuredProviders.map((p) => ({ instanceId: p.instanceId, type: p.type, url: p.url }))
  )
}

export function getProvider(instanceId: string): LLMProvider {
  const provider = registry.get(instanceId)
  if (!provider) throw new Error(`Unknown provider: ${instanceId}`)
  return provider
}
