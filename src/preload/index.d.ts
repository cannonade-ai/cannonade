import { ElectronAPI } from '@electron-toolkit/preload'
import type { Provider, ProviderModelMap } from '@shared/provider-model-map'

export interface AppAPI {
  fetchModels<P extends Provider>(provider: P): Promise<ProviderModelMap[P][]>
  getAppVersion(): Promise<string>
  minimize(): void
  maximize(): void
  close(): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
