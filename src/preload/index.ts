import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PROVIDER } from '@shared/provider/ipc-channels'
import { APP, SUITES, SETTINGS, TEST_RUNS, RUN } from '@shared/app/ipc-channels'
import type { TestSuite } from '@shared/app/test-suite'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { AppSettings } from '@shared/app/app-settings'
import type { TestRun } from '@shared/app/test-run'

const api = {
  fetchLocalModels: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.FETCH_LOCAL_MODELS, instanceId),
  fetchExternalModels: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.FETCH_EXTERNAL_MODELS, instanceId),
  getCapabilities: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.GET_CAPABILITIES, instanceId),
  deleteModel: (instanceId: string, modelId: string) =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL, instanceId, modelId),
  loadModel: (instanceId: string, modelId: string) =>
    ipcRenderer.invoke(PROVIDER.LOAD_MODEL, instanceId, modelId),
  unloadModel: (instanceId: string, loadedInstanceId: string) =>
    ipcRenderer.invoke(PROVIDER.UNLOAD_MODEL, instanceId, loadedInstanceId),
  serverStatus: (instanceId: string) => ipcRenderer.invoke(PROVIDER.SERVER_STATUS, instanceId),
  serverStart: (instanceId: string) => ipcRenderer.invoke(PROVIDER.SERVER_START, instanceId),
  serverStop: (instanceId: string) => ipcRenderer.invoke(PROVIDER.SERVER_STOP, instanceId),
  testConnection: (instanceId: string) => ipcRenderer.invoke(PROVIDER.TEST_CONNECTION, instanceId),
  testConnectionUrl: (type: ProviderType, url: string) =>
    ipcRenderer.invoke(PROVIDER.TEST_CONNECTION_URL, type, url),
  syncProviders: (providers: ConfiguredProvider[]) => ipcRenderer.invoke(PROVIDER.SYNC, providers),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(APP.GET_VERSION),
  getSuitesDir: (): Promise<string> => ipcRenderer.invoke(APP.GET_SUITES_DIR),
  getRunsDir: (): Promise<string> => ipcRenderer.invoke(APP.GET_RUNS_DIR),
  openPath: (path: string): Promise<void> => ipcRenderer.invoke(APP.OPEN_PATH, path),
  minimize: (): void => ipcRenderer.send(APP.MINIMIZE),
  maximize: (): void => ipcRenderer.send(APP.MAXIMIZE),
  close: (): void => ipcRenderer.send(APP.CLOSE),
  listSuites: (): Promise<TestSuite[]> => ipcRenderer.invoke(SUITES.LIST),
  saveSuite: (suite: TestSuite): Promise<void> => ipcRenderer.invoke(SUITES.SAVE, suite),
  deleteSuite: (id: string): Promise<void> => ipcRenderer.invoke(SUITES.DELETE, id),
  loadAppSettings: (): Promise<AppSettings> => ipcRenderer.invoke(SETTINGS.LOAD),
  saveAppSettings: (settings: AppSettings): Promise<void> =>
    ipcRenderer.invoke(SETTINGS.SAVE, settings),
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

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
