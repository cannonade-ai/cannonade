import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import slugify from 'slugify'
import writeFileAtomic from 'write-file-atomic'
import { TEST_RUNS } from '@shared/app/ipc-channels'
import type { TestRun } from '@shared/app/test-run'
import { createLogger } from '@main/logger'
import { getRunsDir } from '@main/data-paths'

const log = createLogger('test-run-handlers')

function runPath(id: string, suiteName: string): string {
  return join(
    getRunsDir(),
    `${id}-${slugify(suiteName, { lower: true, strict: true }).slice(0, 25)}.json`
  )
}

async function ensureRunsDir(): Promise<void> {
  await fs.mkdir(getRunsDir(), { recursive: true })
}

export async function saveTestRun(run: TestRun): Promise<void> {
  await ensureRunsDir()
  await writeFileAtomic(runPath(run.id, run.suiteName), JSON.stringify(run, null, 2))
  log.debug(`Saved test run: ${run.id}`)
}

export function registerTestRunHandlers(): void {
  ipcMain.handle(TEST_RUNS.LIST, async (): Promise<TestRun[]> => {
    await ensureRunsDir()
    const files = await fs.readdir(getRunsDir())
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    if (jsonFiles.length === 0) return []
    const results = await Promise.all(
      jsonFiles.map(async (f): Promise<TestRun | null> => {
        try {
          const raw = await fs.readFile(join(getRunsDir(), f), 'utf-8')
          const run = JSON.parse(raw) as TestRun
          if (typeof run.id !== 'string' || typeof run.createdAt !== 'string') {
            log.warn(`Skipping test run file with unexpected shape: ${f}`)
            return null
          }
          return run
        } catch (error) {
          log.error(`Skipping unreadable test run file: ${f}`, error)
          return null
        }
      })
    )
    const runs: TestRun[] = []
    for (const r of results) {
      if (r !== null) runs.push(r)
    }
    log.debug(`Found ${runs.length} test run files`)
    return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })

  ipcMain.handle(TEST_RUNS.DELETE, async (_event, id: string): Promise<void> => {
    const files = await fs.readdir(getRunsDir())
    const match = files.find((f) => f.startsWith(`${id}-`) && f.endsWith('.json'))
    if (match) {
      await fs.rm(join(getRunsDir(), match), { force: true })
      log.info(`Deleted test run: ${id}`)
    } else {
      log.warn(`Test run not found for deletion: ${id}`)
    }
  })
}
