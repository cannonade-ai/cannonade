import { app, ipcMain, BrowserWindow, shell } from 'electron'
import '../../core/providers'
import { getProvider, createProbeProvider, buildRegistry } from '../../core/providers/registry'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import { PROVIDER } from '@shared/provider/ipc-channels'
import { APP, EVAL } from '@shared/app/ipc-channels'
import { VM } from 'vm2'
import { join } from 'path'
import { registerSuiteHandlers } from './suite-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerTestRunHandlers } from './test-run-handlers'
import type { ChatRequest } from '@shared/lm-studio/chat'

export function registerHandlers(): void {
  registerSuiteHandlers()
  registerSettingsHandlers()
  registerTestRunHandlers()

  ipcMain.handle(
    PROVIDER.GET_CAPABILITIES,
    (_event, providerId: string) => getProvider(providerId).capabilities
  )

  ipcMain.handle(PROVIDER.FETCH_LOCAL_MODELS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.fetchLocalModels) throw new Error(`${providerId}: fetchLocalModels not supported`)
    return provider.fetchLocalModels()
  })

  ipcMain.handle(PROVIDER.FETCH_EXTERNAL_MODELS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.fetchExternalModels)
      throw new Error(`${providerId}: fetchExternalModels not supported`)
    return provider.fetchExternalModels()
  })

  ipcMain.handle(
    PROVIDER.CHAT,
    (_event, providerId: string, modelId: string, request: ChatRequest) => {
      const provider = getProvider(providerId)
      if (!provider.chat) throw new Error(`${providerId}: chat not supported`)
      return provider.chat(modelId, request)
    }
  )

  ipcMain.handle(PROVIDER.DOWNLOAD_MODEL, (_event, providerId: string, url: string) => {
    const provider = getProvider(providerId)
    if (!provider.downloadModel) throw new Error(`${providerId}: downloadModel not supported`)
    return provider.downloadModel(url)
  })

  ipcMain.handle(PROVIDER.DOWNLOAD_MODEL_STATUS, (_event, providerId: string, jobId: string) => {
    const provider = getProvider(providerId)
    if (!provider.getDownloadStatus)
      throw new Error(`${providerId}: getDownloadStatus not supported`)
    return provider.getDownloadStatus(jobId)
  })

  ipcMain.handle(PROVIDER.DELETE_MODEL, (_event, providerId: string, modelId: string) => {
    const provider = getProvider(providerId)
    if (!provider.deleteModel) throw new Error(`${providerId}: deleteModel not supported`)
    return provider.deleteModel(modelId)
  })

  ipcMain.handle(
    PROVIDER.DELETE_MODEL_BY_HF_ID,
    (_event, providerId: string, hfModelId: string) => {
      const provider = getProvider(providerId)
      if (!provider.deleteModelByHfId)
        throw new Error(`${providerId}: deleteModelByHfId not supported`)
      return provider.deleteModelByHfId(hfModelId)
    }
  )

  ipcMain.handle(PROVIDER.LOAD_MODEL, (_event, providerId: string, modelId: string) => {
    const provider = getProvider(providerId)
    if (!provider.loadModel) throw new Error(`${providerId}: loadModel not supported`)
    return provider.loadModel(modelId)
  })

  ipcMain.handle(PROVIDER.UNLOAD_MODEL, (_event, providerId: string, instanceId: string) => {
    const provider = getProvider(providerId)
    if (!provider.unloadModel) throw new Error(`${providerId}: unloadModel not supported`)
    return provider.unloadModel(instanceId)
  })

  ipcMain.handle(PROVIDER.SERVER_STATUS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.getServerStatus) throw new Error(`${providerId}: getServerStatus not supported`)
    return provider.getServerStatus()
  })

  ipcMain.handle(PROVIDER.SERVER_START, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.startServer) throw new Error(`${providerId}: startServer not supported`)
    return provider.startServer()
  })

  ipcMain.handle(PROVIDER.SERVER_STOP, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.stopServer) throw new Error(`${providerId}: stopServer not supported`)
    return provider.stopServer()
  })

  ipcMain.handle(
    PROVIDER.TEST_CONNECTION_URL,
    async (_event, type: ProviderType, url: string): Promise<boolean> => {
      const provider = createProbeProvider(type, url)
      try {
        if (provider.fetchLocalModels) await provider.fetchLocalModels()
        else if (provider.fetchExternalModels) await provider.fetchExternalModels()
        return true
      } catch {
        return false
      }
    }
  )

  ipcMain.handle(PROVIDER.TEST_CONNECTION, async (_event, instanceId: string): Promise<boolean> => {
    const provider = getProvider(instanceId)
    try {
      if (provider.fetchLocalModels) {
        await provider.fetchLocalModels()
      } else if (provider.fetchExternalModels) {
        await provider.fetchExternalModels()
      }
      return true
    } catch {
      return false
    }
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

  ipcMain.handle(PROVIDER.SYNC, (_event, providers: ConfiguredProvider[]): void => {
    buildRegistry(providers)
  })

  ipcMain.on(APP.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on(APP.MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on(APP.CLOSE, () => BrowserWindow.getFocusedWindow()?.close())
}
