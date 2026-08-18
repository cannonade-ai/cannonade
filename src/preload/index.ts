import { contextBridge, ipcRenderer } from 'electron'
import 'electron-log/preload'
import electronLog from 'electron-log/renderer'
import { PROVIDER, SECRETS } from '@shared/provider/ipc-channels'
import {
  APP,
  SUITES,
  PROMPTS,
  SETTINGS,
  TEST_RUNS,
  RUN,
  LOGS,
  UPDATER
} from '@shared/app/ipc-channels'
import type { LogEntry, LogFile } from '@shared/app/logging'
import type { TestSuite } from '@shared/app/test-suite'
import type { Prompt } from '@shared/app/prompt'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { ProbeAuth, SecretInfo } from '@shared/provider/api-key'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { AppInfo } from '@shared/app/app-info'
import type { UpdateState } from '@shared/app/update-info'
import type { TestRun } from '@shared/app/test-run'
import type { ChatRequest, ChatResponse } from '@shared/provider/chat'

const log = electronLog.scope('preload')

const api = {
  fetchLocalModels: (instanceId: string): Promise<LocalModel[]> =>
    ipcRenderer.invoke(PROVIDER.FETCH_LOCAL_MODELS, instanceId),
  fetchExternalModels: (instanceId: string): Promise<ExternalModel[]> =>
    ipcRenderer.invoke(PROVIDER.FETCH_EXTERNAL_MODELS, instanceId),
  getCapabilities: (instanceId: string): Promise<ProviderCapabilities> =>
    ipcRenderer.invoke(PROVIDER.GET_CAPABILITIES, instanceId),
  deleteModel: (instanceId: string, modelId: string): Promise<void> =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL, instanceId, modelId),
  loadModel: (instanceId: string, modelId: string): Promise<void> =>
    ipcRenderer.invoke(PROVIDER.LOAD_MODEL, instanceId, modelId),
  unloadModel: (instanceId: string, loadedInstanceId: string): Promise<void> =>
    ipcRenderer.invoke(PROVIDER.UNLOAD_MODEL, instanceId, loadedInstanceId),
  serverStatus: (instanceId: string): Promise<ServerStatusResponse> =>
    ipcRenderer.invoke(PROVIDER.SERVER_STATUS, instanceId),
  serverStart: (instanceId: string): Promise<ServerStatusResponse> =>
    ipcRenderer.invoke(PROVIDER.SERVER_START, instanceId),
  serverStop: (instanceId: string): Promise<ServerStatusResponse> =>
    ipcRenderer.invoke(PROVIDER.SERVER_STOP, instanceId),
  testConnection: (instanceId: string): Promise<boolean> =>
    ipcRenderer.invoke(PROVIDER.TEST_CONNECTION, instanceId),
  testConnectionUrl: (type: ProviderType, url: string, auth?: ProbeAuth): Promise<boolean> =>
    ipcRenderer.invoke(PROVIDER.TEST_CONNECTION_URL, type, url, auth),
  syncProviders: (providers: ConfiguredProvider[]): Promise<void> =>
    ipcRenderer.invoke(PROVIDER.SYNC, providers),
  chat: (instanceId: string, requestId: string, request: ChatRequest): Promise<ChatResponse> =>
    ipcRenderer.invoke(PROVIDER.CHAT, instanceId, requestId, request),
  abortChat: (requestId: string): Promise<void> =>
    ipcRenderer.invoke(PROVIDER.CHAT_ABORT, requestId),
  getSecretInfo: (envVarName: string, instanceId: string | null): Promise<SecretInfo> =>
    ipcRenderer.invoke(SECRETS.GET_INFO, envVarName, instanceId),
  setSecret: (instanceId: string, value: string): Promise<void> =>
    ipcRenderer.invoke(SECRETS.SET, instanceId, value),
  deleteSecret: (instanceId: string): Promise<void> =>
    ipcRenderer.invoke(SECRETS.DELETE, instanceId),
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(APP.GET_INFO),
  openPath: (path: string): Promise<void> => ipcRenderer.invoke(APP.OPEN_PATH, path),
  minimize: (): void => ipcRenderer.send(APP.MINIMIZE),
  maximize: (): void => ipcRenderer.send(APP.MAXIMIZE),
  close: (): void => ipcRenderer.send(APP.CLOSE),
  getUpdateState: (): Promise<UpdateState> => ipcRenderer.invoke(UPDATER.GET_STATE),
  downloadUpdate: (): void => ipcRenderer.send(UPDATER.DOWNLOAD),
  installUpdate: (): void => ipcRenderer.send(UPDATER.INSTALL),
  onUpdateState: (cb: (state: UpdateState) => void): void => {
    ipcRenderer.on(UPDATER.STATE, (_e, state) => cb(state))
  },
  listSuites: (): Promise<TestSuite[]> => ipcRenderer.invoke(SUITES.LIST),
  saveSuite: (suite: TestSuite): Promise<void> => ipcRenderer.invoke(SUITES.SAVE, suite),
  deleteSuite: (id: string): Promise<void> => ipcRenderer.invoke(SUITES.DELETE, id),
  listPrompts: (): Promise<Prompt[]> => ipcRenderer.invoke(PROMPTS.LIST),
  savePrompt: (prompt: Prompt): Promise<void> => ipcRenderer.invoke(PROMPTS.SAVE, prompt),
  deletePrompt: (id: string): Promise<void> => ipcRenderer.invoke(PROMPTS.DELETE, id),
  loadAppSettings: (): Promise<AppSettings> => ipcRenderer.invoke(SETTINGS.LOAD),
  saveAppSettings: (settings: AppSettings): Promise<void> =>
    ipcRenderer.invoke(SETTINGS.SAVE, settings),
  listLogs: (): Promise<LogEntry[]> => ipcRenderer.invoke(LOGS.LIST),
  getLogsDir: (): Promise<string> => ipcRenderer.invoke(LOGS.GET_DIR),
  listLogFiles: (): Promise<LogFile[]> => ipcRenderer.invoke(LOGS.LIST_FILES),
  readLogFile: (name: string): Promise<LogEntry[]> => ipcRenderer.invoke(LOGS.READ_FILE, name),
  deleteLogFile: (name: string): Promise<void> => ipcRenderer.invoke(LOGS.DELETE_FILE, name),
  onLogEntry: (cb: (entry: LogEntry) => void): void => {
    ipcRenderer.on(LOGS.ENTRY, (_e, entry) => cb(entry))
  },
  listTestRuns: (): Promise<TestRun[]> => ipcRenderer.invoke(TEST_RUNS.LIST),
  deleteTestRun: (id: string): Promise<void> => ipcRenderer.invoke(TEST_RUNS.DELETE, id),
  startRun: (run: TestRun, suite: TestSuite): Promise<void> =>
    ipcRenderer.invoke(RUN.START, run, suite),
  abortRun: (runId: string): Promise<void> => ipcRenderer.invoke(RUN.ABORT, runId),
  onRunStarted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.STARTED, (_e, payload) => cb(payload))
  },
  onRunCompleted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.COMPLETED, (_e, payload) => cb(payload))
  },
  onModelDownloading: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.MODEL_DOWNLOADING, (_e, payload) => cb(payload))
  },
  onModelLoading: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.MODEL_LOADING, (_e, payload) => cb(payload))
  },
  onModelStarted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.MODEL_STARTED, (_e, payload) => cb(payload))
  },
  onModelCompleted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.MODEL_COMPLETED, (_e, payload) => cb(payload))
  },
  onCaseStarted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.CASE_STARTED, (_e, payload) => cb(payload))
  },
  onCaseCompleted: (cb: (payload: unknown) => void): void => {
    ipcRenderer.on(RUN.CASE_COMPLETED, (_e, payload) => cb(payload))
  }
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  log.error('Failed to expose context bridge APIs:', error)
}
