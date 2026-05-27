import { ElectronAPI } from '@electron-toolkit/preload'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/lm-studio/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { TestRun } from '@shared/app/test-run'

export interface AppAPI {
  fetchLocalModels(instanceId: string): Promise<LocalModel[]>
  fetchExternalModels(instanceId: string): Promise<ExternalModel[]>
  chat(instanceId: string, modelId: string, request: ChatRequest): Promise<ChatResponse>
  getCapabilities(instanceId: string): Promise<ProviderCapabilities>
  downloadModel(instanceId: string, url: string): Promise<DownloadModelResponse>
  getDownloadStatus(instanceId: string, jobId: string): Promise<DownloadStatusResponse>
  deleteModel(instanceId: string, modelId: string): Promise<void>
  deleteModelByHfId(instanceId: string, hfModelId: string): Promise<void>
  loadModel(instanceId: string, modelId: string): Promise<void>
  unloadModel(instanceId: string, loadedInstanceId: string): Promise<void>
  serverStatus(instanceId: string): Promise<ServerStatusResponse>
  serverStart(instanceId: string): Promise<ServerStatusResponse>
  serverStop(instanceId: string): Promise<ServerStatusResponse>
  testConnection(instanceId: string): Promise<boolean>
  testConnectionUrl(type: ProviderType, url: string): Promise<boolean>
  syncProviders(providers: ConfiguredProvider[]): Promise<void>
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
  runCustomValidator(code: string, output: string): Promise<{ score: number; details?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
