import { app, ipcMain, BrowserWindow } from 'electron'
import { lmStudioProvider, loadModel, unloadModel, deleteModel } from '../../core/providers/lmstudio'
import { openRouterProvider } from '../../core/providers/openrouter'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP } from '@shared/app/ipc-channels'
import { join } from 'path'
import { registerSuiteHandlers } from './suite-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import type { ChatRequest } from '@shared/lm-studio/chat'
import type { Model } from '@shared/lm-studio/ipc-contracts'

export function registerHandlers(): void {
  registerSuiteHandlers()
  registerSettingsHandlers()
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await lmStudioProvider.fetchModels()
  })

  ipcMain.handle(LMSTUDIO.CHAT, async (_event, request: ChatRequest, apiToken?: string) => {
    return await lmStudioProvider.chat(request, apiToken)
  })

  ipcMain.handle(LMSTUDIO.LOAD_MODEL, async (_event, modelKey: string) => {
    await loadModel(modelKey)
  })

  ipcMain.handle(LMSTUDIO.UNLOAD_MODEL, async (_event, instanceId: string) => {
    await unloadModel(instanceId)
  })

  ipcMain.handle(LMSTUDIO.DELETE_MODEL, async (_event, model: Model) => {
    await deleteModel(model)
  })

  ipcMain.handle(OPENROUTER.FETCH_MODELS, async () => {
    return await openRouterProvider.fetchModels()
  })

  ipcMain.handle(APP.GET_VERSION, () => app.getVersion())
  ipcMain.handle(APP.GET_SUITES_DIR, () => join(app.getPath('userData'), 'suites'))

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
