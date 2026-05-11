import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PROVIDER } from '@shared/provider/ipc-channels'
import { APP, SUITES, SETTINGS, TEST_RUNS, EVAL } from '@shared/app/ipc-channels'
import type { ProviderId } from '@shared/provider/ids'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest } from '@shared/lm-studio/chat'
import type { AppSettings } from '@shared/app/app-settings'
import type { TestRun } from '@shared/app/test-run'

const api = {
  fetchLocalModels: (providerId: ProviderId) =>
    ipcRenderer.invoke(PROVIDER.FETCH_LOCAL_MODELS, providerId),
  fetchExternalModels: (providerId: ProviderId) =>
    ipcRenderer.invoke(PROVIDER.FETCH_EXTERNAL_MODELS, providerId),
  chat: (providerId: ProviderId, modelId: string, request: ChatRequest) =>
    ipcRenderer.invoke(PROVIDER.CHAT, providerId, modelId, request),
  getCapabilities: (providerId: ProviderId) =>
    ipcRenderer.invoke(PROVIDER.GET_CAPABILITIES, providerId),
  downloadModel: (providerId: ProviderId, url: string) =>
    ipcRenderer.invoke(PROVIDER.DOWNLOAD_MODEL, providerId, url),
  getDownloadStatus: (providerId: ProviderId, jobId: string) =>
    ipcRenderer.invoke(PROVIDER.DOWNLOAD_MODEL_STATUS, providerId, jobId),
  deleteModel: (providerId: ProviderId, modelId: string) =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL, providerId, modelId),
  deleteModelByHfId: (providerId: ProviderId, hfModelId: string) =>
    ipcRenderer.invoke(PROVIDER.DELETE_MODEL_BY_HF_ID, providerId, hfModelId),
  loadModel: (providerId: ProviderId, modelId: string) =>
    ipcRenderer.invoke(PROVIDER.LOAD_MODEL, providerId, modelId),
  unloadModel: (providerId: ProviderId, instanceId: string) =>
    ipcRenderer.invoke(PROVIDER.UNLOAD_MODEL, providerId, instanceId),
  serverStatus: (providerId: ProviderId) => ipcRenderer.invoke(PROVIDER.SERVER_STATUS, providerId),
  serverStart: (providerId: ProviderId) => ipcRenderer.invoke(PROVIDER.SERVER_START, providerId),
  serverStop: (providerId: ProviderId) => ipcRenderer.invoke(PROVIDER.SERVER_STOP, providerId),
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
