import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PROVIDER } from '@shared/provider/ipc-channels'
import { APP, SUITES, SETTINGS, TEST_RUNS, EVAL } from '@shared/app/ipc-channels'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest } from '@shared/lm-studio/chat'
import type { ProviderType } from '@shared/provider/configured-provider'
import type { AppSettings } from '@shared/app/app-settings'
import type { TestRun } from '@shared/app/test-run'

const api = {
  fetchLocalModels: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.FETCH_LOCAL_MODELS, instanceId),
  fetchExternalModels: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.FETCH_EXTERNAL_MODELS, instanceId),
  chat: (instanceId: string, modelId: string, request: ChatRequest) =>
    ipcRenderer.invoke(PROVIDER.CHAT, instanceId, modelId, request),
  getCapabilities: (instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.GET_CAPABILITIES, instanceId),
  downloadModel: (instanceId: string, url: string) =>
    ipcRenderer.invoke(PROVIDER.DOWNLOAD_MODEL, instanceId, url),
  getDownloadStatus: (instanceId: string, jobId: string) =>
    ipcRenderer.invoke(PROVIDER.DOWNLOAD_MODEL_STATUS, instanceId, jobId),
  deleteModel: (instanceId: string, modelId: string) =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL, instanceId, modelId),
  deleteModelByHfId: (instanceId: string, hfModelId: string) =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL_BY_HF_ID, instanceId, hfModelId),
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
  saveTestRun: (run: TestRun): Promise<void> => ipcRenderer.invoke(TEST_RUNS.SAVE, run),
  deleteTestRun: (id: string): Promise<void> => ipcRenderer.invoke(TEST_RUNS.DELETE, id),
  runCustomValidator: (
    code: string,
    output: string
  ): Promise<{ score: number; details?: string }> =>
    ipcRenderer.invoke(EVAL.RUN_CUSTOM_VALIDATOR, code, output)
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
