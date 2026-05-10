import type { LLMProvider } from './base'
import type { ProviderId } from '@shared/provider/ids'
import { lmStudioProvider } from './lmstudio'
import { openRouterProvider } from './openrouter'

const providerRegistry: Record<ProviderId, LLMProvider> = {
  lmstudio: lmStudioProvider,
  openrouter: openRouterProvider
}

export function getProvider(id: ProviderId): LLMProvider {
  const provider = providerRegistry[id]
  if (!provider) throw new Error(`Unknown provider: ${id}`)
  return provider
}
