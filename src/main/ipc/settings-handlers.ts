import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { SETTINGS } from '@shared/app/ipc-channels'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/app/app-settings'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8')
    return { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULT_APP_SETTINGS }
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(SETTINGS.LOAD, async (): Promise<AppSettings> => {
    return loadAppSettings()
  })

  ipcMain.handle(SETTINGS.SAVE, async (_event, settings: AppSettings): Promise<void> => {
    await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  })
}
