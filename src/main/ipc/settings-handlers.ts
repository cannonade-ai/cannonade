import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import writeFileAtomic from 'write-file-atomic'
import { SETTINGS } from '@shared/app/ipc-channels'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/app/app-settings'
import { buildRegistry } from '../../core/providers/registry'
import { applyLogLevel, createLogger } from '@main/logger'
import { getSettingsPath } from '@main/data-paths'

const log = createLogger('app-settings')

function toAppSettings(partial: Partial<AppSettings>): AppSettings {
  const { judge, experiments, ...rest } = partial
  const known = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key in DEFAULT_APP_SETTINGS)
  )
  return {
    ...DEFAULT_APP_SETTINGS,
    ...known,
    judge: { ...DEFAULT_APP_SETTINGS.judge, ...judge },
    experiments: { ...DEFAULT_APP_SETTINGS.experiments, ...experiments }
  }
}

let cache: AppSettings = toAppSettings({})

export async function initAppSettings(): Promise<void> {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf-8')
    cache = toAppSettings(JSON.parse(raw) as Partial<AppSettings>)
  } catch (err) {
    log.debug('No saved settings loaded, using defaults:', err)
    cache = toAppSettings({})
  }
  applyLogLevel(cache.logLevel)
  buildRegistry(cache.configuredProviders)
  log.debug('App settings loaded successfully')
}

export function getAppSettings(): AppSettings {
  return cache
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(SETTINGS.LOAD, (): AppSettings => cache)

  ipcMain.handle(SETTINGS.SAVE, async (_event, settings: AppSettings): Promise<void> => {
    cache = toAppSettings(settings)
    applyLogLevel(cache.logLevel)
    await writeFileAtomic(getSettingsPath(), JSON.stringify(cache, null, 2))
    log.debug('App settings saved successfully')
  })
}
