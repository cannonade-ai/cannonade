import '../../core/providers'
import { registerSuiteHandlers } from './suite-handlers'
import { registerPromptHandlers } from './prompt-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerTestRunHandlers } from './test-run-handlers'
import { registerRunHandlers } from './run-handlers'
import { registerSecretHandlers } from './secret-handlers'
import { registerChatHandlers } from './chat-handlers'
import { registerProviderHandlers } from './provider-handlers'
import { registerAppHandlers } from './app-handlers'
import { registerUpdaterHandlers } from './updater-handlers'
import { createLogger } from '@main/logger'

const log = createLogger('ipc-handlers')

export function registerHandlers(): void {
  log.info('registering ipc handlers')

  registerSuiteHandlers()
  registerPromptHandlers()
  registerSettingsHandlers()
  registerTestRunHandlers()
  registerRunHandlers()
  registerSecretHandlers()
  registerChatHandlers()
  registerProviderHandlers()
  registerAppHandlers()
  registerUpdaterHandlers()
}
