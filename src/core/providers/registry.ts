import type { LLMProvider } from './base'
import type { ProviderId } from '@shared/provider/ids'
import { lmStudioProvider } from './lmstudio'
import { openRouterProvider } from './openrouter'

const providerRegistry: Record<ProviderId, LLMProvider> = {
  lmstudio: lmStudioProvider,
  openrouter: openRouterProvider
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

for (const [id, provider] of Object.entries(providerRegistry)) {
  validateProvider(id, provider)
}

export function getProvider(id: ProviderId): LLMProvider {
  const provider = providerRegistry[id]
  if (!provider) throw new Error(`Unknown provider: ${id}`)
  return provider
}
