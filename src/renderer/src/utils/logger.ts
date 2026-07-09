import log from 'electron-log/renderer'
import type { LogFunctions } from 'electron-log'

export function createLogger(scope: string): LogFunctions {
  return log.scope(scope)
}
