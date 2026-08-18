import { ipcMain } from 'electron'
import { UPDATER } from '@shared/app/ipc-channels'
import type { UpdateState } from '@shared/app/update-info'
import { getUpdateState, downloadUpdate, requestInstall } from '../services/updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle(UPDATER.GET_STATE, (): UpdateState => getUpdateState())
  ipcMain.on(UPDATER.DOWNLOAD, () => downloadUpdate())
  ipcMain.on(UPDATER.INSTALL, () => requestInstall())
}
