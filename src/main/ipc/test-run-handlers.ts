import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import slugify from 'slugify'
import { TEST_RUNS } from '@shared/app/ipc-channels'
import type { TestRun } from '@shared/app/test-run'
import { createLogger } from '@main/logger'

const log = createLogger('test-run-handlers')

function runsDir(): string {
  return join(app.getPath('userData'), 'runs')
}

function runPath(id: string, suiteName: string): string {
  return join(
    runsDir(),
    `${id}-${slugify(suiteName, { lower: true, strict: true }).slice(0, 25)}.json`
  )
}

async function ensureRunsDir(): Promise<void> {
  await fs.mkdir(runsDir(), { recursive: true })
}

export async function saveTestRun(run: TestRun): Promise<void> {
  await ensureRunsDir()
  await fs.writeFile(runPath(run.id, run.suiteName), JSON.stringify(run, null, 2), 'utf-8')
  log.debug(`Saved test run: ${run.id}`)
}

export function registerTestRunHandlers(): void {
  ipcMain.handle(TEST_RUNS.LIST, async (): Promise<TestRun[]> => {
    await ensureRunsDir()
    const files = await fs.readdir(runsDir())
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    if (jsonFiles.length === 0) return []
    const runs = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await fs.readFile(join(runsDir(), f), 'utf-8')
        return JSON.parse(raw) as TestRun
      })
    )
    log.debug(`Found ${runs.length} test run files`)
    return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })

  ipcMain.handle(TEST_RUNS.DELETE, async (_event, id: string): Promise<void> => {
    const files = await fs.readdir(runsDir())
    const match = files.find((f) => f.startsWith(`${id}-`) && f.endsWith('.json'))
    if (match) {
      await fs.rm(join(runsDir(), match), { force: true })
      log.info(`Deleted test run: ${id}`)
    } else {
      log.warn(`Test run not found for deletion: ${id}`)
    }
  })
}
