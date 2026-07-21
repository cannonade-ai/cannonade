import { getProvider } from '../../../core/providers/registry'
import { saveTestRun } from '../../ipc/test-run-handlers'
import { RUN } from '@shared/app/ipc-channels'
import type { TestRun, RunStatus, PerModelRun } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { unloadUnselectedModels } from './model-manager'
import { processModelRun } from './model-runner'
import type { SendEvent } from './types'
import { createLogger } from '../../logger'

const log = createLogger('test-runner')

export async function executeTestRun(
  run: TestRun,
  suite: TestSuite,
  send: SendEvent,
  abortSignal: AbortSignal = new AbortController().signal
): Promise<void> {
  const runState: TestRun = structuredClone(run)
  const providerId = run.config.provider
  const provider = getProvider(providerId)
  const capabilities = provider.capabilities
  const defaultTimeoutMs = run.config.defaultTestCaseTimeout ?? 0

  runState.status = 'running'
  runState.startedAt = new Date().toISOString()
  send(RUN.STARTED, { runId: run.id })
  log.info(`Starting test run: ${run.id}`)

  let overallFailed = false

  if (
    capabilities.loadModel &&
    run.config.unloadModelsBeforeRun &&
    provider.fetchLocalModels &&
    provider.unloadModel
  ) {
    await unloadUnselectedModels(provider, run.modelRuns)
  }

  const runModel = async (modelRun: PerModelRun): Promise<void> => {
    const modelRunState = runState.modelRuns.find((m) => m.id === modelRun.id)!
    const modelRunFailed = await processModelRun({
      run,
      suite,
      provider,
      providerId,
      modelRun,
      modelRunState,
      defaultTimeoutMs,
      send,
      abortSignal
    })
    if (modelRunFailed) overallFailed = true
  }

  const parallel = run.config.parallelRun === true && capabilities.externalModels

  if (parallel) {
    await Promise.all(run.modelRuns.map(runModel))
  } else {
    for (const modelRun of run.modelRuns) {
      if (abortSignal.aborted) break
      await runModel(modelRun)
    }
  }

  const finalStatus: RunStatus = abortSignal.aborted
    ? 'cancelled'
    : overallFailed
      ? 'failed'
      : 'completed'
  runState.status = finalStatus
  runState.completedAt = new Date().toISOString()

  await saveTestRun(runState)
  send(RUN.COMPLETED, { runId: run.id, status: finalStatus })
  log.info(`Test run completed: ${run.id} status=${finalStatus}`)
}
