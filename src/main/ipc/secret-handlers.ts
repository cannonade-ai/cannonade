import { ipcMain } from 'electron'
import { SECRETS } from '@shared/provider/ipc-channels'
import { getSecretInfo, setSecret, deleteSecret, type SecretInfo } from '../secrets/secret-store'
import { ensureShellEnvironment } from '../services/executable-path'
import { rebuildRegistry } from '../../core/providers/registry'

export function registerSecretHandlers(): void {
  ipcMain.handle(
    SECRETS.GET_INFO,
    async (_event, envVarName: string, instanceId: string | null): Promise<SecretInfo> => {
      await ensureShellEnvironment()
      return getSecretInfo(envVarName, instanceId)
    }
  )

  ipcMain.handle(SECRETS.SET, async (_event, instanceId: string, value: string): Promise<void> => {
    await setSecret(instanceId, value)
    rebuildRegistry()
  })

  ipcMain.handle(SECRETS.DELETE, async (_event, instanceId: string): Promise<void> => {
    await deleteSecret(instanceId)
    rebuildRegistry()
  })
}
