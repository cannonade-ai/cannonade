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

export const api = {
  fetchLocalModels: (providerId: ProviderId): Promise<LocalModel[]> =>
    window.api.fetchLocalModels(providerId),
  fetchExternalModels: (providerId: ProviderId): Promise<ExternalModel[]> =>
    window.api.fetchExternalModels(providerId),
  chat: (providerId: ProviderId, modelId: string, request: ChatRequest): Promise<ChatResponse> =>
    window.api.chat(providerId, modelId, request),
  getCapabilities: (providerId: ProviderId): Promise<ProviderCapabilities> =>
    window.api.getCapabilities(providerId),
  downloadModel: (providerId: ProviderId, url: string): Promise<DownloadModelResponse> =>
    window.api.downloadModel(providerId, url),
  getDownloadStatus: (providerId: ProviderId, jobId: string): Promise<DownloadStatusResponse> =>
    window.api.getDownloadStatus(providerId, jobId),
  deleteModel: (providerId: ProviderId, modelId: string): Promise<void> =>
    window.api.deleteModel(providerId, modelId),
  deleteModelByHfId: (providerId: ProviderId, hfModelId: string): Promise<void> =>
    window.api.deleteModelByHfId(providerId, hfModelId),
  loadModel: (providerId: ProviderId, modelId: string): Promise<void> =>
    window.api.loadModel(providerId, modelId),
  unloadModel: (providerId: ProviderId, instanceId: string): Promise<void> =>
    window.api.unloadModel(providerId, instanceId),
  serverStatus: (providerId: ProviderId): Promise<ServerStatusResponse> =>
    window.api.serverStatus(providerId),
  serverStart: (providerId: ProviderId): Promise<ServerStatusResponse> =>
    window.api.serverStart(providerId),
  serverStop: (providerId: ProviderId): Promise<ServerStatusResponse> =>
    window.api.serverStop(providerId),
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
