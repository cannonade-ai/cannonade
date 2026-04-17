import { ElectronAPI } from '@electron-toolkit/preload'
import type { Provider, ProviderModelMap } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'

export interface AppAPI {
  fetchModels<P extends Provider>(provider: P): Promise<ProviderModelMap[P][]>
  getAppVersion(): Promise<string>
  minimize(): void
  maximize(): void
  close(): void
  listSuites(): Promise<TestSuite[]>
  saveSuite(suite: TestSuite): Promise<void>
  deleteSuite(id: string): Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
