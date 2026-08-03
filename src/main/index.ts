import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerHandlers } from './ipc/handlers'
import { initAppSettings } from './ipc/settings-handlers'
import { initSecrets } from './secrets/secret-store'
import { initAppState, getAppState, manageWindow } from './app-state'
import { adoptManagedProcesses, stopAllManagedProcesses } from './services/managed-process'
import { initLogger, createLogger } from './logger'
import icon from '../../resources/icon.png?asset'

const log = createLogger('electron-main')

const MIN_ZOOM = -3.0
const MAX_ZOOM = 3.0

function createWindow(): BrowserWindow {
  const { bounds } = getAppState().window

  const mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 1024,
    minHeight: 576,
    show: false,
    backgroundColor: '#0e0e0e',
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  manageWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    log.info('Window ready to show')
  })

  function setZoom(level: number): void {
    mainWindow.webContents.setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level)))
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || (!input.control && !input.meta)) return
    const level = mainWindow.webContents.getZoomLevel()
    if (input.key === '+' || input.key === '=') {
      setZoom(level + 0.5)
      event.preventDefault()
    } else if (input.key === '-') {
      setZoom(level - 0.5)
      event.preventDefault()
    } else if (input.key === '0') {
      setZoom(0)
      event.preventDefault()
    }
  })

  mainWindow.webContents.on('zoom-changed', (_event, direction) => {
    setZoom(mainWindow.webContents.getZoomLevel() + (direction === 'in' ? 0.5 : -0.5))
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    log.info('Loading renderer from dev server (Vite)', {
      url: process.env['ELECTRON_RENDERER_URL']
    })
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    log.info('Loading renderer from production build')
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  initLogger()
  log.info('Electron ready')

  // Set app user model id for windows
  electronApp.setAppUserModelId('app.cannonade')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initSecrets()
  await initAppSettings()
  initAppState()
  await adoptManagedProcesses()
  log.info('App starting', { version: app.getVersion() })
  registerHandlers()
  log.info('init phases done, creating window')
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

let spawnedProcessesStopped = false
app.on('before-quit', (event) => {
  event.preventDefault()
  if (spawnedProcessesStopped) return
  spawnedProcessesStopped = true
  void stopAllManagedProcesses()
    .catch((err) => log.error('Failed to stop managed processes:', err))
    .finally(() => app.exit(0))
})

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  process.on(signal, () => {
    log.info(`Received ${signal}, quitting`)
    app.quit()
  })
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  log.debug(`window-all-closed called. platform: ${process.platform}`)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
