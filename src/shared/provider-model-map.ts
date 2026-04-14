import type { Model as LMStudioModel } from './lm-studio/ipc-contracts'
import type { Model as OpenRouterModel } from './open-router/ipc-contracts'

export type Provider = 'lmstudio' | 'openrouter'

export type ProviderModelMap = {
  lmstudio: LMStudioModel
  openrouter: OpenRouterModel
}
