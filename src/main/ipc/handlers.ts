import { app, ipcMain, BrowserWindow, shell } from 'electron'
import { exec } from 'child_process'
import {
  lmStudioProvider,
  fetchModels,
  loadModel,
  unloadModel,
  deleteModel,
  downloadModel,
  getDownloadStatus,
  deleteModelByHfId
} from '../../core/providers/lmstudio'
import { openRouterProvider } from '../../core/providers/openrouter'
import { LMSTUDIO } from '@shared/lm-studio/ipc-channels'
import { OPENROUTER } from '@shared/open-router/ipc-channels'
import { APP, EVAL } from '@shared/app/ipc-channels'
import { VM } from 'vm2'
import { join } from 'path'
import { registerSuiteHandlers } from './suite-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerTestRunHandlers } from './test-run-handlers'
import type { ChatRequest } from '@shared/lm-studio/chat'
import type { Model, ServerStatusResponse } from '@shared/lm-studio/ipc-contracts'

export function registerHandlers(): void {
  registerSuiteHandlers()
  registerSettingsHandlers()
  registerTestRunHandlers()
  ipcMain.handle(LMSTUDIO.FETCH_MODELS, async () => {
    return await fetchModels()
  })

  ipcMain.handle(LMSTUDIO.CHAT, async (_event, request: ChatRequest) => {
    return await lmStudioProvider.chat!(request.model, request)
  })

  ipcMain.handle(LMSTUDIO.LOAD_MODEL, async (_event, modelKey: string) => {
    await loadModel(modelKey)
  })

  ipcMain.handle(LMSTUDIO.UNLOAD_MODEL, async (_event, instanceId: string) => {
    await unloadModel(instanceId)
  })

  ipcMain.handle(LMSTUDIO.DELETE_MODEL, async (_event, model: Model) => {
    await deleteModel(model)
  })

  ipcMain.handle(LMSTUDIO.DOWNLOAD_MODEL, async (_event, modelUrl: string) => {
    return await downloadModel(modelUrl)
  })

  ipcMain.handle(LMSTUDIO.DOWNLOAD_MODEL_STATUS, async (_event, jobId: string) => {
    return await getDownloadStatus(jobId)
  })

  ipcMain.handle(LMSTUDIO.DELETE_MODEL_BY_HF_ID, async (_event, hfModelId: string) => {
    await deleteModelByHfId(hfModelId)
  })

  ipcMain.handle(LMSTUDIO.SERVER_STATUS, (): Promise<ServerStatusResponse> => {
    return new Promise((resolve) => {
      exec('lms server status', (_err, stdout, stderr) => {
        const output = (stdout || stderr).trim()
        const portMatch = output.match(/port (\d+)/)
        resolve({
          running: output.toLowerCase().includes('is running'),
          port: portMatch ? Number(portMatch[1]) : null
        })
      })
    })
  })

  ipcMain.handle(LMSTUDIO.SERVER_START, (): Promise<ServerStatusResponse> => {
    return new Promise((resolve) => {
      exec('lms server start', (_err, stdout, stderr) => {
        const output = (stdout || stderr).trim()
        const portMatch = output.match(/port (\d+)/)
        resolve({
          running: output.toLowerCase().includes('running'),
          port: portMatch ? Number(portMatch[1]) : null
        })
      })
    })
  })

  ipcMain.handle(LMSTUDIO.SERVER_STOP, (): Promise<ServerStatusResponse> => {
    return new Promise((resolve) => {
      exec('lms server stop', (_err, stdout, stderr) => {
        const output = (stdout || stderr).trim()
        resolve({
          running: !output.toLowerCase().includes('stopped'),
          port: null
        })
      })
    })
  })

  ipcMain.handle(OPENROUTER.FETCH_MODELS, async () => {
    return await openRouterProvider.fetchExternalModels!()
  })

  ipcMain.handle(APP.GET_VERSION, () => app.getVersion())
  ipcMain.handle(APP.GET_SUITES_DIR, () => join(app.getPath('userData'), 'suites'))
  ipcMain.handle(APP.GET_RUNS_DIR, () => join(app.getPath('userData'), 'runs'))
  ipcMain.handle(APP.OPEN_PATH, (_event, path: string) => shell.openPath(path))

  ipcMain.handle(EVAL.RUN_CUSTOM_VALIDATOR, (_event, code: string, output: string) => {
    const vm = new VM({ timeout: 1000, allowAsync: false, sandbox: {} })
    const fn = vm.run(`(${code})`) as (output: string) => { score: number; details?: string }
    const result = fn(output)
    return { score: Math.min(1, Math.max(0, result.score)), details: result.details }
  })

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
