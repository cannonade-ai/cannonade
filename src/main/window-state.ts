import { app, BrowserWindow, screen, type Rectangle } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import writeFileAtomic from 'write-file-atomic'
import { createLogger } from './logger'

const log = createLogger('window-state')

interface WindowState {
  bounds: Rectangle
  isMaximized: boolean
  isFullScreen: boolean
}

const DEFAULT_BOUNDS: Rectangle = { x: 100, y: 60, width: 1100, height: 650 }

function windowStatePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function loadState(): WindowState | null {
  try {
    const raw = readFileSync(windowStatePath(), 'utf-8')
    return JSON.parse(raw) as WindowState
  } catch (err) {
    log.debug('No saved window state, using defaults:', err)
    return null
  }
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

export interface WindowStateManager {
  bounds: Rectangle
  isMaximized: boolean
  isFullScreen: boolean
  manage(window: BrowserWindow): void
}

export function createWindowStateManager(): WindowStateManager {
  const saved = loadState()
  const hasValidBounds = saved !== null && isVisible(saved.bounds)

  const manager: WindowStateManager = {
    bounds: hasValidBounds ? saved!.bounds : { ...DEFAULT_BOUNDS },
    isMaximized: saved?.isMaximized ?? false,
    isFullScreen: saved?.isFullScreen ?? false,

    manage(window: BrowserWindow): void {
      if (manager.isMaximized) window.maximize()
      if (manager.isFullScreen) window.setFullScreen(true)

      function persist(): void {
        if (window.isDestroyed()) return
        manager.isMaximized = window.isMaximized()
        manager.isFullScreen = window.isFullScreen()
        if (!manager.isMaximized && !manager.isFullScreen) {
          manager.bounds = window.getBounds()
        }
        try {
          writeFileAtomic.sync(
            windowStatePath(),
            JSON.stringify(
              {
                bounds: manager.bounds,
                isMaximized: manager.isMaximized,
                isFullScreen: manager.isFullScreen
              },
              null,
              2
            )
          )
        } catch (err) {
          log.error('Persist error:', err)
        }
      }

      let timer: NodeJS.Timeout | null = null
      function persistDebounced(): void {
        if (timer) clearTimeout(timer)
        timer = setTimeout(persist, 500)
      }

      window.on('resize', persistDebounced)
      window.on('move', persistDebounced)
      window.on('maximize', persistDebounced)
      window.on('unmaximize', persistDebounced)
      window.on('enter-full-screen', persistDebounced)
      window.on('leave-full-screen', persistDebounced)
      window.on('close', () => {
        if (timer) clearTimeout(timer)
        persist()
      })
    }
  }

  return manager
}
