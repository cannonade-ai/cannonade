import { RUN } from '@shared/app/ipc-channels'
import { evaluateAll } from '../../eval/evaluator'
import type { TestRun, PerModelRun, RunStatus } from '@shared/app/test-run'
import type { TestSuite, TestCase, TestCaseResult } from '@shared/app/test-suite'
import type { LLMProvider } from '../../../core/providers/base'
import { runChat } from './chat-handler'
import { buildRequest, extractTextOutput, extractReasoningOutput } from './mappers'
import { computeAggregate } from './metric-aggregator'
import {
  toHuggingFaceUrl,
  extractHfModelId,
  resolveModelKey,
  downloadAndPoll,
  isModelLoaded,
  unloadModelAfterRun,
  deleteAutoDownloadedModel
} from './model-manager'
import type { SendEvent } from './types'
import { createLogger } from '../../logger'

const log = createLogger('model-runner')

interface RunTestCaseParams {
  provider: LLMProvider
  modelRun: PerModelRun
  modelRunState: PerModelRun
  testCase: TestCase
  modelKey: string
  run: TestRun
  suite: TestSuite
  defaultTimeoutMs: number
  results: TestCaseResult[]
  send: SendEvent
  abortSignal: AbortSignal
}

interface RunTestCaseOutcome {
  cancelled: boolean
  failed: boolean
  modelInstanceId?: string
}

async function runTestCase(params: RunTestCaseParams): Promise<RunTestCaseOutcome> {
  const { provider, modelRun, modelRunState, testCase, modelKey, suite, send, abortSignal } = params

  const caseRunState = modelRunState.caseRuns.find((c) => c.testCaseId === testCase.id)!
  caseRunState.status = 'running'
  caseRunState.startedAt = new Date().toISOString()
  send(RUN.CASE_STARTED, { modelRunId: modelRun.id, testCaseId: testCase.id })
  log.info('Starting test case:', testCase.name)

  const request = buildRequest(testCase, modelKey, suite.defaultRunConfig)
  const timeoutMs = testCase.timeoutMs ?? params.defaultTimeoutMs

  const startTime = performance.now()

  try {
    const response = await runChat(provider, request, abortSignal, timeoutMs)
    log.debug(`response for modelRun.id: ${modelRun.id}, case: ${testCase.name}:`, response)

    const output = extractTextOutput(response.output)
    const reasoning = extractReasoningOutput(response.output)
    const evaluation = await evaluateAll(output, testCase)
    const durationMs = performance.now() - startTime
    const result: TestCaseResult = {
      testCaseId: testCase.id,
      output,
      reasoning,
      metrics: {
        tokensPerSecond: response.stats.tokens_per_second,
        timeToFirstTokenMs: response.stats.time_to_first_token_seconds * 1000,
        score: evaluation.score,
        durationMs
      },
      passed: evaluation.passed,
      evalResults: evaluation.evalResults,
      error: evaluation.error
    }

    params.results.push(result)
    caseRunState.status = 'completed'
    caseRunState.completedAt = new Date().toISOString()
    caseRunState.result = result
    modelRunState.aggregate = computeAggregate(params.results)
    send(RUN.CASE_COMPLETED, {
      modelRunId: modelRun.id,
      testCaseId: testCase.id,
      result,
      aggregate: modelRunState.aggregate
    })
    log.info(`Test case completed: ${testCase.name} passed=${result.passed}`)
    log.debug('Test case result:', result)
    return { cancelled: false, failed: false, modelInstanceId: response.model_instance_id }
  } catch (err) {
    if (abortSignal.aborted) {
      const result: TestCaseResult = {
        testCaseId: testCase.id,
        output: '',
        metrics: {},
        passed: false,
        evalResults: [],
        error: 'Cancelled'
      }
      caseRunState.status = 'cancelled'
      caseRunState.completedAt = new Date().toISOString()
      caseRunState.result = result
      send(RUN.CASE_COMPLETED, {
        modelRunId: modelRun.id,
        testCaseId: testCase.id,
        status: 'cancelled',
        result,
        aggregate: modelRunState.aggregate ?? computeAggregate(params.results)
      })
      log.info('Test case cancelled:', testCase.name)
      return { cancelled: true, failed: false }
    }

    const error = err instanceof Error ? err.message : String(err)
    const result: TestCaseResult = {
      testCaseId: testCase.id,
      output: '',
      metrics: {},
      passed: false,
      evalResults: [],
      error
    }
    params.results.push(result)
    caseRunState.status = 'completed'
    caseRunState.completedAt = new Date().toISOString()
    caseRunState.result = result
    modelRunState.aggregate = computeAggregate(params.results)
    send(RUN.CASE_COMPLETED, {
      modelRunId: modelRun.id,
      testCaseId: testCase.id,
      result,
      aggregate: modelRunState.aggregate
    })
    log.error(`Test case failed: ${testCase.name}, error: ${error}`)
    log.debug('Test case result:', result)
    return { cancelled: false, failed: true }
  }
}

interface RunModelRunParams {
  run: TestRun
  suite: TestSuite
  provider: LLMProvider
  providerId: string
  modelRun: PerModelRun
  modelRunState: PerModelRun
  defaultTimeoutMs: number
  send: SendEvent
  abortSignal: AbortSignal
}

export async function processModelRun(params: RunModelRunParams): Promise<boolean> {
  const { run, suite, provider, providerId, modelRun, modelRunState, send, abortSignal } = params
  const capabilities = provider.capabilities
  const results: TestCaseResult[] = []
  let fatalError: string | undefined
  let autoDownloaded = false
  let overallFailed = false

  try {
    const ref = modelRun.modelRef
    if (capabilities.downloadModel && (ref.source === 'huggingface' || ref.source === 'registry')) {
      modelRunState.status = 'downloading'
      const downloadTarget =
        ref.source === 'huggingface' ? toHuggingFaceUrl(extractHfModelId(ref.modelId)) : ref.modelId
      autoDownloaded = await downloadAndPoll(
        providerId,
        modelRun.id,
        downloadTarget,
        send,
        abortSignal
      )
    }
  } catch (err) {
    fatalError = err instanceof Error ? err.message : String(err)
    modelRunState.status = abortSignal.aborted ? 'cancelled' : 'failed'
    modelRunState.completedAt = new Date().toISOString()
    modelRunState.aggregate = computeAggregate(results, suite.testCases)
    modelRunState.error = fatalError
    send(RUN.MODEL_COMPLETED, {
      modelRunId: modelRun.id,
      status: modelRunState.status,
      aggregate: modelRunState.aggregate,
      error: fatalError
    })
    log.error(`Model download failed: ${modelRun.id}`, fatalError)
    return true
  }

  if (abortSignal.aborted) return overallFailed

  modelRunState.status = 'running'
  modelRunState.autoDownloaded = autoDownloaded
  modelRunState.startedAt = new Date().toISOString()
  send(RUN.MODEL_STARTED, { modelRunId: modelRun.id, autoDownloaded })

  let modelKey: string
  if (modelRun.modelRef.source === 'installed') {
    modelKey = modelRun.modelRef.modelKey
  } else if (modelRun.modelRef.source === 'external') {
    modelKey = modelRun.modelRef.modelId
  } else {
    const downloadId =
      modelRun.modelRef.source === 'huggingface'
        ? extractHfModelId(modelRun.modelRef.modelId)
        : modelRun.modelRef.modelId
    modelKey = await resolveModelKey(providerId, downloadId)
  }

  if (capabilities.loadModel && capabilities.localModels && provider.loadModel) {
    const alreadyLoaded = await isModelLoaded(provider, modelKey)

    if (!alreadyLoaded) {
      modelRunState.status = 'loading'
      send(RUN.MODEL_LOADING, { modelRunId: modelRun.id })
      log.info(`Loading model: ${modelKey}, modelRun: ${modelRun.id}`)
      try {
        await provider.loadModel(modelKey)
      } catch (err) {
        fatalError = err instanceof Error ? err.message : String(err)
        modelRunState.status = abortSignal.aborted ? 'cancelled' : 'failed'
        modelRunState.completedAt = new Date().toISOString()
        modelRunState.aggregate = computeAggregate(results, suite.testCases)
        modelRunState.error = fatalError
        send(RUN.MODEL_COMPLETED, {
          modelRunId: modelRun.id,
          status: modelRunState.status,
          aggregate: modelRunState.aggregate,
          error: fatalError
        })
        log.error(`Model load failed: ${modelRun.id}`, fatalError)
        return true
      }
      if (abortSignal.aborted) return overallFailed
      modelRunState.status = 'running'
    }
  }

  log.info(`Starting model run: ${modelRun.id}, model: ${modelKey}`)
  let modelInstanceId: string | undefined

  try {
    for (const testCase of suite.testCases) {
      if (abortSignal.aborted) break

      const outcome = await runTestCase({
        provider,
        modelRun,
        modelRunState,
        testCase,
        modelKey,
        run,
        suite,
        defaultTimeoutMs: params.defaultTimeoutMs,
        results,
        send,
        abortSignal
      })

      if (!modelInstanceId && outcome.modelInstanceId) modelInstanceId = outcome.modelInstanceId
      if (outcome.failed) overallFailed = true
      if (outcome.cancelled) break
    }
  } catch (err) {
    fatalError = err instanceof Error ? err.message : String(err)
    overallFailed = true
    log.error('Test case completed with fatal error:', fatalError)
  }

  const modelStatus: RunStatus = abortSignal.aborted
    ? 'cancelled'
    : fatalError || overallFailed
      ? 'failed'
      : 'completed'
  modelRunState.status = modelStatus
  modelRunState.completedAt = new Date().toISOString()
  modelRunState.aggregate = computeAggregate(results, suite.testCases)
  if (fatalError) modelRunState.error = fatalError
  send(RUN.MODEL_COMPLETED, {
    modelRunId: modelRun.id,
    status: modelStatus,
    aggregate: modelRunState.aggregate,
    error: fatalError
  })
  log.info(`Model run completed: ${modelRun.id} status=${modelStatus}`)
  log.debug('Model run:', modelRun)

  if (capabilities.loadModel && run.config.unloadModelsAfterRun && modelInstanceId) {
    await unloadModelAfterRun(provider, providerId, modelInstanceId)
  }

  if (capabilities.deleteModel && autoDownloaded && run.config.deleteAutoDownloadedModels) {
    await deleteAutoDownloadedModel(provider, providerId, modelRun.modelRef, modelKey)
  }

  return overallFailed
}
