import { app, ipcMain, BrowserWindow, shell } from 'electron'
import { APP, LOGS } from '@shared/app/ipc-channels'
import { join } from 'path'
import { getBufferedLogs } from '@main/logger'

export function registerAppHandlers(): void {
  ipcMain.handle(LOGS.LIST, () => getBufferedLogs())

  ipcMain.handle(APP.GET_VERSION, () => app.getVersion())
  ipcMain.handle(APP.GET_SUITES_DIR, () => join(app.getPath('userData'), 'suites'))
  ipcMain.handle(APP.GET_RUNS_DIR, () => join(app.getPath('userData'), 'runs'))
  ipcMain.handle(APP.GET_PROMPTS_DIR, () => join(app.getPath('userData'), 'prompts'))
  ipcMain.handle(APP.OPEN_PATH, (_event, path: string) => shell.openPath(path))

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
