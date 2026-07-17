import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import writeFileAtomic from 'write-file-atomic'
import { SUITES } from '@shared/app/ipc-channels'
import { DEFAULT_SUITE } from './default-suite'
import type { TestSuite } from '@shared/app/test-suite'
import { createLogger } from '@main/logger'

const log = createLogger('suite-handlers')

function suitesDir(): string {
  return join(app.getPath('userData'), 'suites')
}

function suitePath(id: string): string {
  return join(suitesDir(), `${id}.json`)
}

function markerPath(): string {
  return join(suitesDir(), '.initialized')
}

async function ensureSuitesDir(): Promise<void> {
  await fs.mkdir(suitesDir(), { recursive: true })
}

async function isInitialized(): Promise<boolean> {
  try {
    await fs.access(markerPath())
    return true
  } catch {
    return false
  }
}

async function markInitialized(): Promise<void> {
  await fs.writeFile(markerPath(), '', 'utf-8')
}

export function registerSuiteHandlers(): void {
  ipcMain.handle(SUITES.LIST, async (): Promise<TestSuite[]> => {
    await ensureSuitesDir()
    const files = await fs.readdir(suitesDir())
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    log.debug(`Found ${jsonFiles.length} suite files`)

    if (jsonFiles.length <= 0) {
      if (await isInitialized()) return []
      log.debug('No suites found, writing default suite')
      await markInitialized()
      await writeFileAtomic(suitePath(DEFAULT_SUITE.id), JSON.stringify(DEFAULT_SUITE, null, 2))
      return [DEFAULT_SUITE]
    }

    const suites = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await fs.readFile(join(suitesDir(), f), 'utf-8')
        return JSON.parse(raw) as TestSuite
      })
    )
    log.debug('Loaded suites', suites.length)
    return suites.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  })

  ipcMain.handle(SUITES.SAVE, async (_event, suite: TestSuite): Promise<void> => {
    log.debug('Saving suite', suite.id)
    await ensureSuitesDir()
    await writeFileAtomic(suitePath(suite.id), JSON.stringify(suite, null, 2))
  })

  ipcMain.handle(SUITES.DELETE, async (_event, id: string): Promise<void> => {
    log.debug('Deleting suite', id)
    await fs.rm(suitePath(id), { force: true })
  })
}
