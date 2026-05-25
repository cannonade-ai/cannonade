import type { LLMProvider } from './base'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'

type ProviderFactory = (instanceId: string, url: string, remote: boolean) => LLMProvider

const registry = new Map<string, LLMProvider>()
const factories = new Map<string, ProviderFactory>()

export function registerProviderFactory(type: string, factory: ProviderFactory): void {
  factories.set(type, factory)
}

export function createProbeProvider(type: string, url: string): LLMProvider {
  const factory = factories.get(type) ?? factories.get('custom')
  if (!factory) throw new Error(`No factory registered for provider type: ${type}`)
  return factory('__probe__', url, false)
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
      providerConfig.isRemote ?? false
    )
    validateProvider(providerConfig.instanceId, provider)
    registry.set(providerConfig.instanceId, provider)
  }
}

export function getProvider(instanceId: string): LLMProvider {
  const provider = registry.get(instanceId)
  if (!provider) throw new Error(`Unknown provider: ${instanceId}`)
  return provider
}
