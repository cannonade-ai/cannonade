import type { Model } from '@shared/lm-studio/ipc-contracts'

export interface LLMProvider {
  fetchModels(): Promise<Model[]>
}
