import log from 'electron-log/main'
import type { LogFunctions, LogMessage, Transport } from 'electron-log'
import type { LogEntry, LogLevel } from '@shared/app/logging'
import { DEFAULT_APP_SETTINGS } from '@shared/app/app-settings'

const MAX_BUFFER_SIZE = 1000
const buffer: LogEntry[] = []

function formatDataItem(item: unknown): string {
  if (typeof item === 'string') return item
  if (item instanceof Error) return item.stack ?? item.message
  try {
    return JSON.stringify(item)
  } catch {
    return String(item)
  }
}

const bufferTransport = Object.assign(
  (message: LogMessage): void => {
    buffer.push({
      timestamp: message.date.toISOString(),
      level: message.level,
      scope: message.scope ?? 'main',
      message: message.data.map(formatDataItem).join(' ')
    })
    if (buffer.length > MAX_BUFFER_SIZE) buffer.shift()
  },
  { level: 'info' as LogLevel, transforms: [] }
) as Transport

export function initLogger(): void {
  log.initialize()
  log.scope.labelPadding = false
  log.transports.buffer = bufferTransport
  log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}]{scope} > {text}'
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} > {text}'
  applyLogLevel(DEFAULT_APP_SETTINGS.logLevel)
}

export function applyLogLevel(level: LogLevel): void {
  log.transports.file.level = level
  log.transports.console.level = level
  bufferTransport.level = level
}

export function getBufferedLogs(): LogEntry[] {
  return [...buffer]
}

export function createLogger(scope: string): LogFunctions {
  return log.scope(scope)
}
