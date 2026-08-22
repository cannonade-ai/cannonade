import { BrowserWindow, screen, type Rectangle } from 'electron'
import { readFileSync } from 'fs'
import writeFileAtomic from 'write-file-atomic'
import { createLogger } from './logger'
import { getAppStatePath } from './data-paths'

const log = createLogger('app-state')

export interface ManagedServerRecord {
  pid: number
  executable: string
}

export interface WindowLayout {
  bounds: Rectangle
  isMaximized: boolean
  isFullScreen: boolean
}

export interface AppState {
  window: WindowLayout
  managedServers: Record<string, ManagedServerRecord>
}

const DEFAULT_BOUNDS: Rectangle = { x: 100, y: 60, width: 1100, height: 650 }

function defaultAppState(): AppState {
  return {
    window: { bounds: { ...DEFAULT_BOUNDS }, isMaximized: false, isFullScreen: false },
    managedServers: {}
  }
}

const appState: AppState = defaultAppState()

export function getAppState(): AppState {
  return appState
}

function isVisible(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      bounds.x < area.x + area.width &&
      bounds.x + bounds.width > area.x &&
      bounds.y < area.y + area.height &&
      bounds.y + bounds.height > area.y
    )
  })
}

function persist(): void {
  try {
    writeFileAtomic.sync(getAppStatePath(), JSON.stringify(appState, null, 2))
  } catch (err) {
    log.error('Persist error:', err)
  }
}

export function initAppState(): void {
  try {
    const raw = readFileSync(getAppStatePath(), 'utf-8')
    const saved = JSON.parse(raw) as Partial<AppState>
    appState.window = { ...appState.window, ...saved.window }
    appState.managedServers = saved.managedServers ?? appState.managedServers
  } catch (err) {
    log.debug('No saved app state, using defaults:', err)
  }

  if (!isVisible(appState.window.bounds)) {
    appState.window.bounds = { ...DEFAULT_BOUNDS }
  }
  log.debug('App state loaded successfully')
}

export function saveManagedServers(managedServers: Record<string, ManagedServerRecord>): void {
  appState.managedServers = managedServers
  persist()
}

export function manageWindow(window: BrowserWindow): void {
  const layout = appState.window
  if (layout.isMaximized) window.maximize()
  if (layout.isFullScreen) window.setFullScreen(true)

  function persistWindow(): void {
    if (window.isDestroyed()) return
    layout.isMaximized = window.isMaximized()
    layout.isFullScreen = window.isFullScreen()
    if (!layout.isMaximized && !layout.isFullScreen) {
      layout.bounds = window.getBounds()
    }
    persist()
  }

  let timer: NodeJS.Timeout | null = null
  function persistDebounced(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(persistWindow, 500)
  }

  window.on('resize', persistDebounced)
  window.on('move', persistDebounced)
  window.on('maximize', persistDebounced)
  window.on('unmaximize', persistDebounced)
  window.on('enter-full-screen', persistDebounced)
  window.on('leave-full-screen', persistDebounced)
  window.on('close', () => {
    if (timer) clearTimeout(timer)
    persistWindow()
  })
}
