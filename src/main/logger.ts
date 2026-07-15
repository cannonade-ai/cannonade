import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import log from 'electron-log/main'
import type { LogFunctions, LogMessage, Transport } from 'electron-log'
import type { LogEntry, LogLevel } from '@shared/app/logging'
import { DEFAULT_APP_SETTINGS } from '@shared/app/app-settings'

const MAX_BUFFER_SIZE = 1000
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024
const CURRENT_LOG_FILE = 'main.log'
const buffer: LogEntry[] = []

export function getLogsDirectory(): string {
  return app.getPath('logs')
}

function formatArchiveDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNextArchivePath(date: Date): string {
  const dir = getLogsDirectory()
  const dateLabel = formatArchiveDate(date)
  let sequence = 1
  while (fs.existsSync(path.join(dir, `${dateLabel}.${sequence}.log`))) {
    sequence++
  }
  return path.join(dir, `${dateLabel}.${sequence}.log`)
}

function archiveLogFile(filePath: string, date: Date): void {
  try {
    fs.renameSync(filePath, getNextArchivePath(date))
  } catch (error) {
    log.warn('Failed to archive log file', filePath, error)
  }
}

function archivePreviousSessionLog(): void {
  const filePath = path.join(getLogsDirectory(), CURRENT_LOG_FILE)
  try {
    const stats = fs.statSync(filePath)
    if (stats.size === 0) return
    archiveLogFile(filePath, stats.mtime)
  } catch {
    return
  }
}

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
  archivePreviousSessionLog()
  log.initialize()
  log.scope.labelPadding = false
  log.transports.buffer = bufferTransport
  log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}]{scope} > {text}'
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} > {text}'
  log.transports.file.resolvePathFn = (): string => path.join(getLogsDirectory(), CURRENT_LOG_FILE)
  log.transports.file.maxSize = MAX_LOG_FILE_SIZE
  log.transports.file.archiveLogFn = (oldFile): void => archiveLogFile(oldFile.path, new Date())
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
