import { app } from 'electron'
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DATA_DIR_NAME = '.cannonade'
const MIGRATION_MARKER = '.migrated'
const LEGACY_ENTRIES = [
  'settings.json',
  'credentials.json',
  'app-state.json',
  'suites',
  'runs',
  'prompts',
  'models'
]

export interface DataDirSetup {
  path: string
  migrated: string[]
  failed: string[]
}

export function getDataDir(): string {
  return join(homedir(), DATA_DIR_NAME)
}

export function getSuitesDir(): string {
  return join(getDataDir(), 'suites')
}

export function getRunsDir(): string {
  return join(getDataDir(), 'runs')
}

export function getPromptsDir(): string {
  return join(getDataDir(), 'prompts')
}

export function getModelsDir(): string {
  return join(getDataDir(), 'models')
}

export function getLogsDir(): string {
  return join(getDataDir(), 'logs')
}

export function getSettingsPath(): string {
  return join(getDataDir(), 'settings.json')
}

export function getCredentialsPath(): string {
  return join(getDataDir(), 'credentials.json')
}

export function getAppStatePath(): string {
  return join(getDataDir(), 'app-state.json')
}

function copyLegacyEntries(legacyDir: string, dataDir: string, setup: DataDirSetup): void {
  for (const entry of LEGACY_ENTRIES) {
    const source = join(legacyDir, entry)
    const target = join(dataDir, entry)
    if (!existsSync(source) || existsSync(target)) continue
    try {
      cpSync(source, target, { recursive: true })
      setup.migrated.push(entry)
    } catch {
      setup.failed.push(entry)
    }
  }
}

export function initDataDir(): DataDirSetup {
  const dataDir = getDataDir()
  const setup: DataDirSetup = { path: dataDir, migrated: [], failed: [] }
  mkdirSync(dataDir, { recursive: true })

  const marker = join(dataDir, MIGRATION_MARKER)
  if (existsSync(marker)) return setup

  const legacyDir = app.getPath('userData')
  if (legacyDir !== dataDir) copyLegacyEntries(legacyDir, dataDir, setup)

  try {
    writeFileSync(marker, '', 'utf-8')
  } catch {
    setup.failed.push(MIGRATION_MARKER)
  }
  return setup
}
