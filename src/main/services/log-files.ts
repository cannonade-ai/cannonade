import path from 'node:path'
import fs from 'node:fs/promises'
import { LOG_LEVELS, type LogEntry, type LogFile, type LogLevel } from '@shared/app/logging'
import { getLogsDirectory } from '@main/logger'

const ARCHIVE_NAME_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.log$/
const LINE_PATTERN =
  /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\] \[(\w+)\]\s*(?:\(([^)]+)\))?\s*(?:>\s?)?(.*)$/

function resolveArchivePath(name: string): string {
  if (!ARCHIVE_NAME_PATTERN.test(name)) {
    throw new Error(`Not an archived log file: ${name}`)
  }
  return path.join(getLogsDirectory(), name)
}

export async function listLogFiles(): Promise<LogFile[]> {
  const dir = getLogsDirectory()
  let names: string[]
  try {
    names = await fs.readdir(dir)
  } catch {
    return []
  }
  const files = await Promise.all(
    names
      .filter((name) => ARCHIVE_NAME_PATTERN.test(name))
      .map(async (name): Promise<LogFile> => {
        const stats = await fs.stat(path.join(dir, name))
        return { name, sizeBytes: stats.size, modifiedAt: stats.mtime.toISOString() }
      })
  )
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

function parseLevel(value: string): LogLevel {
  return LOG_LEVELS.includes(value as LogLevel) ? (value as LogLevel) : 'info'
}

export function parseLogFile(content: string): LogEntry[] {
  const entries: LogEntry[] = []
  for (const line of content.split(/\r?\n/)) {
    const match = LINE_PATTERN.exec(line)
    if (match) {
      entries.push({
        seq: entries.length,
        timestamp: new Date(match[1].replace(' ', 'T')).toISOString(),
        level: parseLevel(match[2]),
        scope: match[3] ?? 'main',
        message: match[4]
      })
    } else if (line && entries.length > 0) {
      entries[entries.length - 1].message += `\n${line}`
    }
  }
  return entries
}

export async function readLogFile(name: string): Promise<LogEntry[]> {
  const content = await fs.readFile(resolveArchivePath(name), 'utf8')
  return parseLogFile(content)
}

export async function deleteLogFile(name: string): Promise<void> {
  await fs.unlink(resolveArchivePath(name))
}
