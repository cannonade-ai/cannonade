import { app, ipcMain, BrowserWindow, shell } from 'electron'
import { APP, LOGS } from '@shared/app/ipc-channels'
import { join } from 'path'
import { getBufferedLogs, getLogsDirectory } from '@main/logger'
import { listLogFiles, readLogFile, deleteLogFile } from '../services/log-files'

export function registerAppHandlers(): void {
  ipcMain.handle(LOGS.LIST, () => getBufferedLogs())
  ipcMain.handle(LOGS.GET_DIR, () => getLogsDirectory())
  ipcMain.handle(LOGS.LIST_FILES, () => listLogFiles())
  ipcMain.handle(LOGS.READ_FILE, (_event, name: string) => readLogFile(name))
  ipcMain.handle(LOGS.DELETE_FILE, (_event, name: string) => deleteLogFile(name))

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
