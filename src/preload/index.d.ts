import { ElectronAPI } from '@electron-toolkit/preload'
import type { FetchModelsResult } from '@shared/lm-studio/ipc-contracts'

export interface AppAPI {
  fetchModels(): Promise<FetchModelsResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
