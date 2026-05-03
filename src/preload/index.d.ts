import { ElectronAPI } from '@electron-toolkit/preload'
import type { Provider, ProviderModelMap } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { TestRun } from '@shared/app/test-run'

export interface AppAPI {
  fetchModels<P extends Provider>(provider: P): Promise<ProviderModelMap[P][]>
  lmStudioChat(request: ChatRequest, apiToken?: string): Promise<ChatResponse>
  lmStudioLoadModel(modelKey: string): Promise<void>
  lmStudioUnloadModel(instanceId: string): Promise<void>
  lmStudioDeleteModel(model: Model): Promise<void>
  getAppVersion(): Promise<string>
  getSuitesDir(): Promise<string>
  getRunsDir(): Promise<string>
  openPath(path: string): Promise<void>
  minimize(): void
  maximize(): void
  close(): void
  listSuites(): Promise<TestSuite[]>
  saveSuite(suite: TestSuite): Promise<void>
  deleteSuite(id: string): Promise<void>
  loadAppSettings(): Promise<AppSettings>
  saveAppSettings(settings: AppSettings): Promise<void>
  listTestRuns(): Promise<TestRun[]>
  saveTestRun(run: TestRun): Promise<void>
  deleteTestRun(id: string): Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
