import { app, ipcMain } from 'electron'
import { lmStudioProvider } from '../../core/providers/lmstudio'
import { openRouterProvider } from '../../core/providers/openrouter'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP } from '@shared/app/ipc-channels'

export function registerHandlers(): void {
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await lmStudioProvider.fetchModels()
  })

  ipcMain.handle(OPENROUTER.FETCH_MODELS, async () => {
    return await openRouterProvider.fetchModels()
  })

  ipcMain.handle(APP.GET_VERSION, () => app.getVersion())
}
