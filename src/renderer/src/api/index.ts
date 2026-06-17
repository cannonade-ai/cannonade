import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { TestSuite } from '@shared/app/test-suite'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { SecretInfo } from '@shared/provider/api-key'
import type { TestRun } from '@shared/app/test-run'
import type {
  RunStartedPayload,
  RunCompletedPayload,
  ModelDownloadingPayload,
  ModelStartedPayload,
  ModelCompletedPayload,
  CaseStartedPayload,
  CaseCompletedPayload
} from '../../../preload/index.d'

export const api = {
  fetchLocalModels: (instanceId: string): Promise<LocalModel[]> =>
    window.api.fetchLocalModels(instanceId),
  fetchExternalModels: (instanceId: string): Promise<ExternalModel[]> =>
    window.api.fetchExternalModels(instanceId),
  getCapabilities: (instanceId: string): Promise<ProviderCapabilities> =>
    window.api.getCapabilities(instanceId),
  deleteModel: (instanceId: string, modelId: string): Promise<void> =>
    window.api.deleteModel(instanceId, modelId),
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
  syncProviders: (providers: ConfiguredProvider[]): Promise<void> =>
    window.api.syncProviders(providers),
  getSecretInfo: (type: ProviderType): Promise<SecretInfo> => window.api.getSecretInfo(type),
  setSecret: (type: ProviderType, value: string): Promise<void> =>
    window.api.setSecret(type, value),
  deleteSecret: (type: ProviderType): Promise<void> => window.api.deleteSecret(type),
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
  deleteTestRun: (id: string): Promise<void> => window.api.deleteTestRun(id),
  startRun: (run: TestRun, suite: TestSuite): Promise<void> => window.api.startRun(run, suite),
  abortRun: (runId: string): Promise<void> => window.api.abortRun(runId),
  onRunStarted: (cb: (payload: RunStartedPayload) => void): void => window.api.onRunStarted(cb),
  onRunCompleted: (cb: (payload: RunCompletedPayload) => void): void =>
    window.api.onRunCompleted(cb),
  onModelDownloading: (cb: (payload: ModelDownloadingPayload) => void): void =>
    window.api.onModelDownloading(cb),
  onModelStarted: (cb: (payload: ModelStartedPayload) => void): void =>
    window.api.onModelStarted(cb),
  onModelCompleted: (cb: (payload: ModelCompletedPayload) => void): void =>
    window.api.onModelCompleted(cb),
  onCaseStarted: (cb: (payload: CaseStartedPayload) => void): void => window.api.onCaseStarted(cb),
  onCaseCompleted: (cb: (payload: CaseCompletedPayload) => void): void =>
    window.api.onCaseCompleted(cb)
}
