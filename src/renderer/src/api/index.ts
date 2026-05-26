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
import type { ProviderType } from '@shared/provider/configured-provider'
import type { TestRun } from '@shared/app/test-run'

export const api = {
  fetchLocalModels: (instanceId: string): Promise<LocalModel[]> =>
    window.api.fetchLocalModels(instanceId),
  fetchExternalModels: (instanceId: string): Promise<ExternalModel[]> =>
    window.api.fetchExternalModels(instanceId),
  chat: (instanceId: string, modelId: string, request: ChatRequest): Promise<ChatResponse> =>
    window.api.chat(instanceId, modelId, request),
  getCapabilities: (instanceId: string): Promise<ProviderCapabilities> =>
    window.api.getCapabilities(instanceId),
  downloadModel: (instanceId: string, url: string): Promise<DownloadModelResponse> =>
    window.api.downloadModel(instanceId, url),
  getDownloadStatus: (instanceId: string, jobId: string): Promise<DownloadStatusResponse> =>
    window.api.getDownloadStatus(instanceId, jobId),
  deleteModel: (instanceId: string, modelId: string): Promise<void> =>
    window.api.deleteModel(instanceId, modelId),
  deleteModelByHfId: (instanceId: string, hfModelId: string): Promise<void> =>
    window.api.deleteModelByHfId(instanceId, hfModelId),
  loadModel: (instanceId: string, modelId: string): Promise<void> =>
    window.api.loadModel(instanceId, modelId),
  unloadModel: (instanceId: string, loadedInstanceId: string): Promise<void> =>
    window.api.unloadModel(instanceId, loadedInstanceId),
  serverStatus: (instanceId: string): Promise<ServerStatusResponse> =>
    window.api.serverStatus(instanceId),
  serverStart: (instanceId: string): Promise<ServerStatusResponse> =>
    window.api.serverStart(instanceId),
  serverStop: (instanceId: string): Promise<ServerStatusResponse> =>
    window.api.serverStop(instanceId),
  testConnection: (instanceId: string): Promise<boolean> => window.api.testConnection(instanceId),
  testConnectionUrl: (type: ProviderType, url: string): Promise<boolean> =>
    window.api.testConnectionUrl(type, url),
  getAppVersion: (): Promise<string> => window.api.getAppVersion(),
  getSuitesDir: (): Promise<string> => window.api.getSuitesDir(),
  getRunsDir: (): Promise<string> => window.api.getRunsDir(),
  openPath: (path: string): Promise<void> => window.api.openPath(path),
  minimize: (): void => window.api.minimize(),
  maximize: (): void => window.api.maximize(),
  close: (): void => window.api.close(),
  listSuites: (): Promise<TestSuite[]> => window.api.listSuites(),
  saveSuite: (suite: TestSuite): Promise<void> => window.api.saveSuite(suite),
  deleteSuite: (id: string): Promise<void> => window.api.deleteSuite(id),
  loadAppSettings: (): Promise<AppSettings> => window.api.loadAppSettings(),
  saveAppSettings: (settings: AppSettings): Promise<void> => window.api.saveAppSettings(settings),
  listTestRuns: (): Promise<TestRun[]> => window.api.listTestRuns(),
  saveTestRun: (run: TestRun): Promise<void> => window.api.saveTestRun(run),
  deleteTestRun: (id: string): Promise<void> => window.api.deleteTestRun(id),
  runCustomValidator: (
    code: string,
    output: string
  ): Promise<{ score: number; details?: string }> => window.api.runCustomValidator(code, output)
}
