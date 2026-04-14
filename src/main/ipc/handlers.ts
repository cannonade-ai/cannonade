import { app, ipcMain, BrowserWindow } from 'electron'
import { lmStudioProvider } from '../../core/providers/lmstudio'
import { openRouterProvider } from '../../core/providers/openrouter'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP } from '@shared/app/ipc-channels'

export function registerHandlers(): void {
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await lmStudioProvider.fetchModels()
  })

  ipcMain.handle(OPENROUTER.FETCH_MODELS, async () => {
    return await openRouterProvider.fetchModels()
  })

  ipcMain.handle(APP.GET_VERSION, () => app.getVersion())

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
