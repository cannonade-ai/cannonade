import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { SUITES } from '@shared/app/ipc-channels'
import type { TestSuite } from '@shared/app/test-suite'

function suitesDir(): string {
  return join(app.getPath('userData'), 'suites')
}

function suitePath(id: string): string {
  return join(suitesDir(), `${id}.json`)
}

async function ensureSuitesDir(): Promise<void> {
  await fs.mkdir(suitesDir(), { recursive: true })
}

export function registerSuiteHandlers(): void {
  ipcMain.handle(SUITES.LIST, async (): Promise<TestSuite[]> => {
    await ensureSuitesDir()
    const dir = suitesDir()
    console.log('dir', dir)
    const files = await fs.readdir(dir)
    const suites = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (f) => {
          const raw = await fs.readFile(join(suitesDir(), f), 'utf-8')
          return JSON.parse(raw) as TestSuite
        })
    )
    return suites.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  })

  ipcMain.handle(SUITES.SAVE, async (_event, suite: TestSuite): Promise<void> => {
    await ensureSuitesDir()
    await fs.writeFile(suitePath(suite.id), JSON.stringify(suite, null, 2), 'utf-8')
  })

  ipcMain.handle(SUITES.DELETE, async (_event, id: string): Promise<void> => {
    await fs.rm(suitePath(id), { force: true })
  })
}
