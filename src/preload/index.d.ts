import { ElectronAPI } from '@electron-toolkit/preload'
import type { FetchModelsResult } from '@shared/lm-studio/ipc-contracts'
import type { FetchOpenRouterModelsResult } from '@shared/open-router/ipc-contracts'

export interface AppAPI {
  fetchModels(): Promise<FetchModelsResult>
  fetchOpenRouterModels(): Promise<FetchOpenRouterModelsResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
