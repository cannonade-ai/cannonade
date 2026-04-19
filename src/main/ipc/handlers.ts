import { app, ipcMain, BrowserWindow } from 'electron'
import { lmStudioProvider } from '../../core/providers/lmstudio'
import { openRouterProvider } from '../../core/providers/openrouter'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP } from '@shared/app/ipc-channels'
import type { ChatRequest } from '@shared/lm-studio/chat'
import { join } from 'path'
import { registerSuiteHandlers } from './suite-handlers'

export function registerHandlers(): void {
  registerSuiteHandlers()
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await lmStudioProvider.fetchModels()
  })

  ipcMain.handle(LMSTUDIO.CHAT, async (_event, request: ChatRequest, apiToken?: string) => {
    return await lmStudioProvider.chat(request, apiToken)
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
