import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { FetchModelsResult } from '@shared/lm-studio/ipc-contracts'
import type { FetchOpenRouterModelsResult } from '@shared/open-router/ipc-contracts'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'

const api = {
  fetchModels: (): Promise<FetchModelsResult> => ipcRenderer.invoke(LMSTUDIO.FETCH_MODELS),
  fetchOpenRouterModels: (): Promise<FetchOpenRouterModelsResult> =>
    ipcRenderer.invoke(OPENROUTER.FETCH_MODELS)
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
