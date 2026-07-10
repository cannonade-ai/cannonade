import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { TestSuite } from '@shared/app/test-suite'
import type { Prompt } from '@shared/app/prompt'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { SecretInfo, ProbeAuth } from '@shared/provider/api-key'
import type { TestRun } from '@shared/app/test-run'
import type { LogEntry } from '@shared/app/logging'
import type { ChatRequest, ChatResponse } from '@shared/provider/chat'
import type {
  RunStartedPayload,
  RunCompletedPayload,
  ModelDownloadingPayload,
  ModelLoadingPayload,
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
  testConnectionUrl: (type: ProviderType, url: string, auth?: ProbeAuth): Promise<boolean> =>
    window.api.testConnectionUrl(type, url, auth),
  syncProviders: (providers: ConfiguredProvider[]): Promise<void> =>
    window.api.syncProviders(providers),
  chat: (instanceId: string, requestId: string, request: ChatRequest): Promise<ChatResponse> =>
    window.api.chat(instanceId, requestId, request),
  abortChat: (requestId: string): Promise<void> => window.api.abortChat(requestId),
  getSecretInfo: (envVarName: string, instanceId: string | null): Promise<SecretInfo> =>
    window.api.getSecretInfo(envVarName, instanceId),
  setSecret: (instanceId: string, value: string): Promise<void> =>
    window.api.setSecret(instanceId, value),
  deleteSecret: (instanceId: string): Promise<void> => window.api.deleteSecret(instanceId),
  getAppVersion: (): Promise<string> => window.api.getAppVersion(),
  getSuitesDir: (): Promise<string> => window.api.getSuitesDir(),
  getRunsDir: (): Promise<string> => window.api.getRunsDir(),
  getPromptsDir: (): Promise<string> => window.api.getPromptsDir(),
  openPath: (path: string): Promise<void> => window.api.openPath(path),
  minimize: (): void => window.api.minimize(),
  maximize: (): void => window.api.maximize(),
  close: (): void => window.api.close(),
  listSuites: (): Promise<TestSuite[]> => window.api.listSuites(),
  saveSuite: (suite: TestSuite): Promise<void> => window.api.saveSuite(suite),
  deleteSuite: (id: string): Promise<void> => window.api.deleteSuite(id),
  listPrompts: (): Promise<Prompt[]> => window.api.listPrompts(),
  savePrompt: (prompt: Prompt): Promise<void> => window.api.savePrompt(prompt),
  deletePrompt: (id: string): Promise<void> => window.api.deletePrompt(id),
  loadAppSettings: (): Promise<AppSettings> => window.api.loadAppSettings(),
  saveAppSettings: (settings: AppSettings): Promise<void> => window.api.saveAppSettings(settings),
  listLogs: (): Promise<LogEntry[]> => window.api.listLogs(),
  listTestRuns: (): Promise<TestRun[]> => window.api.listTestRuns(),
  deleteTestRun: (id: string): Promise<void> => window.api.deleteTestRun(id),
  startRun: (run: TestRun, suite: TestSuite): Promise<void> => window.api.startRun(run, suite),
  abortRun: (runId: string): Promise<void> => window.api.abortRun(runId),
  onRunStarted: (cb: (payload: RunStartedPayload) => void): void => window.api.onRunStarted(cb),
  onRunCompleted: (cb: (payload: RunCompletedPayload) => void): void =>
    window.api.onRunCompleted(cb),
  onModelDownloading: (cb: (payload: ModelDownloadingPayload) => void): void =>
    window.api.onModelDownloading(cb),
  onModelLoading: (cb: (payload: ModelLoadingPayload) => void): void =>
    window.api.onModelLoading(cb),
  onModelStarted: (cb: (payload: ModelStartedPayload) => void): void =>
    window.api.onModelStarted(cb),
  onModelCompleted: (cb: (payload: ModelCompletedPayload) => void): void =>
    window.api.onModelCompleted(cb),
  onCaseStarted: (cb: (payload: CaseStartedPayload) => void): void => window.api.onCaseStarted(cb),
  onCaseCompleted: (cb: (payload: CaseCompletedPayload) => void): void =>
    window.api.onCaseCompleted(cb)
}
