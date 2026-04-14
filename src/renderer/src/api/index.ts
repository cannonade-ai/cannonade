import type { FetchModelsResult } from '@shared/lm-studio/ipc-contracts'

export const api = {
  fetchModels: (): Promise<FetchModelsResult> => window.api.fetchModels()
}
