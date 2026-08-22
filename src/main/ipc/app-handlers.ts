import { app, ipcMain, BrowserWindow, shell } from 'electron'
import { APP, LOGS } from '@shared/app/ipc-channels'
import type { AppInfo } from '@shared/app/app-info'
import { getBufferedLogs, getLogsDirectory } from '@main/logger'
import { listLogFiles, readLogFile, deleteLogFile } from '../services/log-files'
import { getDataDir, getSuitesDir, getRunsDir, getPromptsDir } from '@main/data-paths'

export function registerAppHandlers(): void {
  ipcMain.handle(LOGS.LIST, () => getBufferedLogs())
  ipcMain.handle(LOGS.GET_DIR, () => getLogsDirectory())
  ipcMain.handle(LOGS.LIST_FILES, () => listLogFiles())
  ipcMain.handle(LOGS.READ_FILE, (_event, name: string) => readLogFile(name))
  ipcMain.handle(LOGS.DELETE_FILE, (_event, name: string) => deleteLogFile(name))

  ipcMain.handle(
    APP.GET_INFO,
    (): AppInfo => ({
      version: app.getVersion(),
      dataDir: getDataDir(),
      suitesDir: getSuitesDir(),
      runsDir: getRunsDir(),
      promptsDir: getPromptsDir()
    })
  )
  ipcMain.handle(APP.OPEN_PATH, (_event, path: string) => shell.openPath(path))

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
