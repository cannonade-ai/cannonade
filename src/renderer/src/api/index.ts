import type { FetchModelsResult } from '@shared/lm-studio/ipc-contracts'
import type { FetchOpenRouterModelsResult } from '@shared/open-router/ipc-contracts'

export const api = {
  fetchModels: (): Promise<FetchModelsResult> => window.api.fetchModels(),
  fetchOpenRouterModels: (): Promise<FetchOpenRouterModelsResult> =>
    window.api.fetchOpenRouterModels()
}
