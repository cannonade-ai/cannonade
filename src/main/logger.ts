import path from 'node:path'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import type { LogFunctions, LogMessage, Transport } from 'electron-log'
import type { LogEntry, LogLevel } from '@shared/app/logging'
import { DEFAULT_APP_SETTINGS } from '@shared/app/app-settings'
import { LOGS } from '@shared/app/ipc-channels'
import { getLogsDir } from './data-paths'

const MAX_BUFFER_SIZE = 1000
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024
const CURRENT_LOG_FILE = 'main.log'
const buffer: LogEntry[] = []
let sequence = 0

export function getLogsDirectory(): string {
  return getLogsDir()
}

function formatArchiveDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}`
}

function getArchivePath(date: Date): string {
  return path.join(getLogsDirectory(), `${formatArchiveDate(date)}.log`)
}

function archiveLogFile(filePath: string, date: Date): void {
  const archivePath = getArchivePath(date)
  try {
    if (fs.existsSync(archivePath)) {
      fs.appendFileSync(archivePath, fs.readFileSync(filePath))
      fs.unlinkSync(filePath)
    } else {
      fs.renameSync(filePath, archivePath)
    }
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

function broadcastEntry(entry: LogEntry): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(LOGS.ENTRY, entry)
  }
}

const bufferTransport = Object.assign(
  (message: LogMessage): void => {
    const entry: LogEntry = {
      seq: sequence++,
      timestamp: message.date.toISOString(),
      level: message.level,
      scope: message.scope ?? 'main',
      message: message.data.map(formatDataItem).join(' ')
    }
    buffer.push(entry)
    if (buffer.length > MAX_BUFFER_SIZE) buffer.shift()
    broadcastEntry(entry)
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
