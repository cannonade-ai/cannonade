import { ElectronAPI } from '@electron-toolkit/preload'
import type { ProviderId } from '@shared/provider/ids'
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
import type { TestRun } from '@shared/app/test-run'

export interface AppAPI {
  fetchLocalModels(providerId: ProviderId): Promise<LocalModel[]>
  fetchExternalModels(providerId: ProviderId): Promise<ExternalModel[]>
  chat(providerId: ProviderId, modelId: string, request: ChatRequest): Promise<ChatResponse>
  getCapabilities(providerId: ProviderId): Promise<ProviderCapabilities>
  downloadModel(providerId: ProviderId, url: string): Promise<DownloadModelResponse>
  getDownloadStatus(providerId: ProviderId, jobId: string): Promise<DownloadStatusResponse>
  deleteModel(providerId: ProviderId, modelId: string): Promise<void>
  deleteModelByHfId(providerId: ProviderId, hfModelId: string): Promise<void>
  loadModel(providerId: ProviderId, modelId: string): Promise<void>
  unloadModel(providerId: ProviderId, instanceId: string): Promise<void>
  serverStatus(providerId: ProviderId): Promise<ServerStatusResponse>
  serverStart(providerId: ProviderId): Promise<ServerStatusResponse>
  serverStop(providerId: ProviderId): Promise<ServerStatusResponse>
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
