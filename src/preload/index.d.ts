import { ElectronAPI } from '@electron-toolkit/preload'
import type { Provider, ProviderModelMap } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type { AppSettings } from '@shared/app/app-settings'

export interface AppAPI {
  fetchModels<P extends Provider>(provider: P): Promise<ProviderModelMap[P][]>
  lmStudioChat(request: ChatRequest, apiToken?: string): Promise<ChatResponse>
  getAppVersion(): Promise<string>
  getSuitesDir(): Promise<string>
  minimize(): void
  maximize(): void
  close(): void
  listSuites(): Promise<TestSuite[]>
  saveSuite(suite: TestSuite): Promise<void>
  deleteSuite(id: string): Promise<void>
  loadAppSettings(): Promise<AppSettings>
  saveAppSettings(settings: AppSettings): Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
