import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { SETTINGS } from '@shared/app/ipc-channels'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/app/app-settings'
import { buildRegistry } from '../../core/providers/registry'
import { applyLogLevel, createLogger } from '../logger'

const log = createLogger('app-settings')

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

let cache: AppSettings = { ...DEFAULT_APP_SETTINGS }

export async function initAppSettings(): Promise<void> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8')
    cache = { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch (err) {
    log.debug('No saved settings loaded, using defaults:', err)
    cache = { ...DEFAULT_APP_SETTINGS }
  }
  buildRegistry(cache.configuredProviders)
  applyLogLevel(cache.logLevel)
}

export function getAppSettings(): AppSettings {
  return cache
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(SETTINGS.LOAD, (): AppSettings => cache)

  ipcMain.handle(SETTINGS.SAVE, async (_event, settings: AppSettings): Promise<void> => {
    cache = settings
    applyLogLevel(settings.logLevel)
    await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  })
}
