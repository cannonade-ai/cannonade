import { ipcMain } from 'electron'
import { lmStudioProvider } from '../../core/providers/lmstudio'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'

export function registerHandlers(): void {
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await lmStudioProvider.fetchModels()
  })
}
