import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { UpdateStatus, type UpdateState } from '@shared/app/update-info'
import { UPDATER } from '@shared/app/ipc-channels'
import { createLogger } from '@main/logger'

const log = createLogger('app-updater')

const state: UpdateState = {
  status: UpdateStatus.Idle,
  currentVersion: '',
  latestVersion: '',
  percent: 0,
  error: ''
}

let relaunchAfterInstall = false

function broadcast(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(UPDATER.STATE, { ...state })
  }
}

export function getUpdateState(): UpdateState {
  return { ...state }
}

export function initUpdater(): void {
  state.currentVersion = app.getVersion()

  if (!app.isPackaged) {
    log.info('Skipping update check, app is not packaged')
    return
  }

  autoUpdater.logger = createLogger('electron-updater')
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => log.info('Checking for update'))

  autoUpdater.on('update-available', (info) => {
    state.status = UpdateStatus.Available
    state.latestVersion = info.version
    state.error = ''
    log.info('Update available', info.version)
    broadcast()
  })

  autoUpdater.on('update-not-available', () => {
    state.status = UpdateStatus.Idle
    log.info('No update available')
    broadcast()
  })

  autoUpdater.on('download-progress', (progress) => {
    state.status = UpdateStatus.Downloading
    state.percent = Math.round(progress.percent)
    broadcast()
  })

  autoUpdater.on('update-downloaded', (info) => {
    state.status = UpdateStatus.Ready
    state.percent = 100
    log.info('Update downloaded, ready to install', info.version)
    broadcast()
  })

  autoUpdater.on('error', (error) => {
    state.status = UpdateStatus.Error
    state.error = error.message
    log.error('Update failed:', error)
    broadcast()
  })

  void autoUpdater.checkForUpdates()
}

export function downloadUpdate(): void {
  if (state.status !== UpdateStatus.Available && state.status !== UpdateStatus.Error) return
  state.status = UpdateStatus.Downloading
  state.percent = 0
  state.error = ''
  broadcast()
  void autoUpdater.downloadUpdate()
}

export function requestInstall(): void {
  if (state.status !== UpdateStatus.Ready) return
  relaunchAfterInstall = true
  app.quit()
}

export function isUpdateReady(): boolean {
  return state.status === UpdateStatus.Ready
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(true, relaunchAfterInstall)
}
