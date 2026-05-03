import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP, SUITES, SETTINGS, TEST_RUNS } from '@shared/app/ipc-channels'
import type { ProviderModelMap, Provider } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'
import type { TestRun } from '@shared/app/test-run'

const CHANNEL: Record<Provider, string> = {
  lmstudio: LMSTUDIO.FETCH_MODELS,
  openrouter: OPENROUTER.FETCH_MODELS
}

const api = {
  fetchModels: <P extends Provider>(provider: P): Promise<ProviderModelMap[P][]> =>
    ipcRenderer.invoke(CHANNEL[provider]),
  lmStudioChat: (request: ChatRequest, apiToken?: string): Promise<ChatResponse> =>
    ipcRenderer.invoke(LMSTUDIO.CHAT, request, apiToken),
  lmStudioLoadModel: (modelKey: string): Promise<void> =>
    ipcRenderer.invoke(LMSTUDIO.LOAD_MODEL, modelKey),
  lmStudioUnloadModel: (instanceId: string): Promise<void> =>
    ipcRenderer.invoke(LMSTUDIO.UNLOAD_MODEL, instanceId),
  lmStudioDeleteModel: (model: Model): Promise<void> =>
    ipcRenderer.invoke(LMSTUDIO.DELETE_MODEL, model),
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
  deleteTestRun: (id: string): Promise<void> => ipcRenderer.invoke(TEST_RUNS.DELETE, id)
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
