import { ipcMain } from 'electron'
import { RUN } from '@shared/app/ipc-channels'
import { executeTestRun } from '../services/test-runner'
import type { TestRun } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { createLogger } from '../logger'

const log = createLogger('run-handlers')

const abortControllers = new Map<string, AbortController>()

export function registerRunHandlers(): void {
  ipcMain.handle(RUN.START, async (event, run: TestRun, suite: TestSuite): Promise<void> => {
    log.info(`RUN.START received, runId: ${run.id}, provider: ${run.config.provider}`)

    const sender = event.sender
    const send = (channel: string, payload: unknown): void => {
      log.debug('Sending event:', channel, payload)
      sender.send(channel, payload)
    }
    const controller = new AbortController()
    abortControllers.set(run.id, controller)

    executeTestRun(run, suite, send, controller.signal)
      .catch((err) => log.error('Unexpected error in executeTestRun:', err))
      .finally(() => abortControllers.delete(run.id))
  })

  ipcMain.handle(RUN.ABORT, async (_event, runId: string): Promise<void> => {
    log.info(`RUN.ABORT received, runId: ${runId}`)
    abortControllers.get(runId)?.abort()
    abortControllers.delete(runId)
  })
}
