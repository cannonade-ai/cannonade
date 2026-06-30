import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerHandlers } from './ipc/handlers'
import { initAppSettings } from './ipc/settings-handlers'
import { initSecrets } from './secrets/secret-store'
import icon from '../../resources/icon.png?asset'

const MIN_ZOOM = -3.0
const MAX_ZOOM = 3.0

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    show: false,
    backgroundColor: '#0e0e0e',
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initSecrets()
  await initAppSettings()
  registerHandlers()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
