import { ElectronAPI } from '@electron-toolkit/preload'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { TestSuite } from '@shared/app/test-suite'
import type { Prompt } from '@shared/app/prompt'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { SecretInfo } from '@shared/provider/api-key'
import type { TestRun, RunStatus, AggregateMetrics } from '@shared/app/test-run'
import type { LogEntry } from '@shared/app/logging'
import type { TestCaseResult } from '@shared/app/test-suite'

export interface RunStartedPayload {
  runId: string
}

export interface RunCompletedPayload {
  runId: string
  status: RunStatus
}

export interface ModelDownloadingPayload {
  modelRunId: string
  downloadedBytes: number
  totalBytes: number
  estimatedCompletion?: string
}

export interface ModelLoadingPayload {
  modelRunId: string
}

export interface ModelStartedPayload {
  modelRunId: string
  autoDownloaded: boolean
}

export interface ModelCompletedPayload {
  modelRunId: string
  status: RunStatus
  aggregate: AggregateMetrics
  error?: string
}

export interface CaseStartedPayload {
  modelRunId: string
  testCaseId: string
}

export interface CaseCompletedPayload {
  modelRunId: string
  testCaseId: string
  status?: RunStatus
  result: TestCaseResult
  aggregate: AggregateMetrics
}

export interface AppAPI {
  fetchLocalModels(instanceId: string): Promise<LocalModel[]>
  fetchExternalModels(instanceId: string): Promise<ExternalModel[]>
  getCapabilities(instanceId: string): Promise<ProviderCapabilities>
  deleteModel(instanceId: string, modelId: string): Promise<void>
  loadModel(instanceId: string, modelId: string): Promise<void>
  unloadModel(instanceId: string, loadedInstanceId: string): Promise<void>
  serverStatus(instanceId: string): Promise<ServerStatusResponse>
  serverStart(instanceId: string): Promise<ServerStatusResponse>
  serverStop(instanceId: string): Promise<ServerStatusResponse>
  testConnection(instanceId: string): Promise<boolean>
  testConnectionUrl(type: ProviderType, url: string): Promise<boolean>
  syncProviders(providers: ConfiguredProvider[]): Promise<void>
  getSecretInfo(type: ProviderType): Promise<SecretInfo>
  setSecret(type: ProviderType, value: string): Promise<void>
  deleteSecret(type: ProviderType): Promise<void>
  getAppVersion(): Promise<string>
  getSuitesDir(): Promise<string>
  getRunsDir(): Promise<string>
  getPromptsDir(): Promise<string>
  openPath(path: string): Promise<void>
  minimize(): void
  maximize(): void
  close(): void
  listSuites(): Promise<TestSuite[]>
  saveSuite(suite: TestSuite): Promise<void>
  deleteSuite(id: string): Promise<void>
  listPrompts(): Promise<Prompt[]>
  savePrompt(prompt: Prompt): Promise<void>
  deletePrompt(id: string): Promise<void>
  loadAppSettings(): Promise<AppSettings>
  saveAppSettings(settings: AppSettings): Promise<void>
  listLogs(): Promise<LogEntry[]>
  listTestRuns(): Promise<TestRun[]>
  deleteTestRun(id: string): Promise<void>
  startRun(run: TestRun, suite: TestSuite): Promise<void>
  abortRun(runId: string): Promise<void>
  onRunStarted(cb: (payload: RunStartedPayload) => void): void
  onRunCompleted(cb: (payload: RunCompletedPayload) => void): void
  onModelDownloading(cb: (payload: ModelDownloadingPayload) => void): void
  onModelLoading(cb: (payload: ModelLoadingPayload) => void): void
  onModelStarted(cb: (payload: ModelStartedPayload) => void): void
  onModelCompleted(cb: (payload: ModelCompletedPayload) => void): void
  onCaseStarted(cb: (payload: CaseStartedPayload) => void): void
  onCaseCompleted(cb: (payload: CaseCompletedPayload) => void): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
