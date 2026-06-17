import { ipcMain } from 'electron'
import { SECRETS } from '@shared/provider/ipc-channels'
import { KNOWN_PROVIDER_DEFAULTS, type ProviderType } from '@shared/provider/configured-provider'
import { getSecretInfo, setSecret, deleteSecret, type SecretInfo } from '../secrets/secret-store'
import { buildRegistry } from '../../core/providers/registry'
import { getAppSettings } from './settings-handlers'

function rebuildRegistry(): void {
  buildRegistry(getAppSettings().configuredProviders)
}

function envNames(type: ProviderType): readonly string[] {
  return KNOWN_PROVIDER_DEFAULTS[type].apiKeyEnvNames
}

export function registerSecretHandlers(): void {
  ipcMain.handle(SECRETS.GET_INFO, (_event, type: ProviderType): SecretInfo => {
    return getSecretInfo(envNames(type))
  })

  ipcMain.handle(SECRETS.SET, async (_event, type: ProviderType, value: string): Promise<void> => {
    await setSecret(envNames(type)[0], value)
    rebuildRegistry()
  })

  ipcMain.handle(SECRETS.DELETE, async (_event, type: ProviderType): Promise<void> => {
    await deleteSecret(envNames(type)[0])
    rebuildRegistry()
  })
}
