import { ipcMain } from 'electron'
import { getProvider, createProbeProvider, buildRegistry } from '../../core/providers/registry'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import type { ProbeAuth } from '@shared/provider/api-key'
import { PROVIDER } from '@shared/provider/ipc-channels'
import { createLogger } from '@main/logger'

const log = createLogger('provider-handler')

export function registerProviderHandlers(): void {
  ipcMain.handle(
    PROVIDER.GET_CAPABILITIES,
    (_event, providerId: string) => getProvider(providerId).capabilities
  )

  ipcMain.handle(PROVIDER.FETCH_LOCAL_MODELS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.fetchLocalModels) throw new Error(`${providerId}: fetchLocalModels not supported`)
    log.debug(`fetching local models for providerId:${providerId}`)
    return provider.fetchLocalModels()
  })

  ipcMain.handle(PROVIDER.FETCH_EXTERNAL_MODELS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.fetchExternalModels)
      throw new Error(`${providerId}: fetchExternalModels not supported`)
    log.debug(`fetching external models for providerId:${providerId}`)
    return provider.fetchExternalModels()
  })

  ipcMain.handle(PROVIDER.DELETE_MODEL, (_event, providerId: string, modelId: string) => {
    const provider = getProvider(providerId)
    if (!provider.deleteModel) throw new Error(`${providerId}: deleteModel not supported`)
    log.debug(`deleting modelId: ${modelId} in providerId:${providerId}`)
    return provider.deleteModel(modelId)
  })

  ipcMain.handle(PROVIDER.LOAD_MODEL, (_event, providerId: string, modelId: string) => {
    const provider = getProvider(providerId)
    if (!provider.loadModel) throw new Error(`${providerId}: loadModel not supported`)
    log.debug(`loading modelId: ${modelId} in providerId:${providerId}`)
    return provider.loadModel(modelId)
  })

  ipcMain.handle(PROVIDER.UNLOAD_MODEL, (_event, providerId: string, instanceId: string) => {
    const provider = getProvider(providerId)
    if (!provider.unloadModel) throw new Error(`${providerId}: unloadModel not supported`)
    log.debug(`unloading instanceId:${instanceId} in providerId:${providerId}`)
    return provider.unloadModel(instanceId)
  })

  ipcMain.handle(PROVIDER.SERVER_STATUS, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.getServerStatus) throw new Error(`${providerId}: getServerStatus not supported`)
    log.debug(`getting server status for providerId:${providerId}`)
    return provider.getServerStatus()
  })

  ipcMain.handle(PROVIDER.SERVER_START, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.startServer) throw new Error(`${providerId}: startServer not supported`)
    log.debug(`starting server for providerId:${providerId}`)
    return provider.startServer()
  })

  ipcMain.handle(PROVIDER.SERVER_STOP, (_event, providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider.stopServer) throw new Error(`${providerId}: stopServer not supported`)
    log.debug(`stopping server for providerId:${providerId}`)
    return provider.stopServer()
  })

  ipcMain.handle(
    PROVIDER.TEST_CONNECTION_URL,
    async (_event, type: ProviderType, url: string, auth?: ProbeAuth): Promise<boolean> => {
      const provider = createProbeProvider(type, url, auth)
      try {
        if (provider.fetchLocalModels) await provider.fetchLocalModels()
        else if (provider.fetchExternalModels) await provider.fetchExternalModels()
        log.debug(
          `connection test successful for ${type} at ${url} with auth method ${auth?.authMethod}`
        )
        return true
      } catch (err) {
        log.debug(`connection test failed for ${type} at ${url}:`, err)
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
    } catch (err) {
      log.debug(`Connection test failed for ${instanceId}:`, err)
      return false
    }
  })

  ipcMain.handle(PROVIDER.SYNC, (_event, providers: ConfiguredProvider[]): void => {
    buildRegistry(providers)
  })
}
