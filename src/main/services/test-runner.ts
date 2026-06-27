import { getProvider } from '../../core/providers/registry'
import { saveTestRun } from '../ipc/test-run-handlers'
import { evaluateAll } from '../eval/evaluator'
import { RUN } from '@shared/app/ipc-channels'
import type { TestRun, RunStatus } from '@shared/app/test-run'
import type {
  TestSuite,
  TestCase,
  TestCaseResult,
  AggregateMetrics,
  RunConfig
} from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/provider/chat'
import type { LocalModel } from '@shared/provider/local-model'

type SendEvent = (channel: string, payload: unknown) => void

const HF_BASE_URL = 'https://huggingface.co/'
const POLL_INTERVAL_MS = 1000

function toHuggingFaceUrl(modelId: string): string {
  return modelId.startsWith('https://') ? modelId : `${HF_BASE_URL}${modelId}`
}

function extractHfModelId(modelId: string): string {
  return modelId.startsWith(HF_BASE_URL) ? modelId.slice(HF_BASE_URL.length) : modelId
}

async function resolveModelKey(providerId: string, hfModelId: string): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider.fetchLocalModels) throw new Error(`${providerId}: fetchLocalModels not supported`)

  const hfParts = hfModelId.split('/')
  const normalizedKey =
    hfParts.length >= 2 ? hfParts[hfParts.length - 1].toLowerCase().replace(/-gguf$/i, '') : null

  const findMatch = (models: LocalModel[]): LocalModel | undefined =>
    models.find(
      (m) =>
        m.id.toLowerCase().includes(hfModelId.toLowerCase()) ||
        (normalizedKey !== null && m.id.toLowerCase() === normalizedKey) ||
        (normalizedKey !== null && m.id.toLowerCase().endsWith('/' + normalizedKey))
    )

  let match = findMatch(await provider.fetchLocalModels())
  if (!match) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      match = findMatch(await provider.fetchLocalModels!())
      if (match) break
    }
  }
  if (!match) throw new Error(`Downloaded model not found in provider: ${hfModelId}`)
  return match.id
}

async function downloadAndPoll(
  providerId: string,
  modelRunId: string,
  downloadTarget: string,
  send: SendEvent,
  signal: AbortSignal
): Promise<boolean> {
  const provider = getProvider(providerId)
  if (!provider.downloadModel) throw new Error(`${providerId}: downloadModel not supported`)
  if (!provider.getDownloadStatus) throw new Error(`${providerId}: getDownloadStatus not supported`)

  const response = await provider.downloadModel(downloadTarget)

  if (response.status === 'already_downloaded') {
    return false
  }

  const jobId = response.job_id
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS / 2))
  while (!signal.aborted) {
    const status = await provider.getDownloadStatus!(jobId)
    if (status.status === 'completed') return true
    if (status.status === 'failed') throw new Error(`Download failed for ${downloadTarget}`)
    send(RUN.MODEL_DOWNLOADING, {
      modelRunId,
      downloadedBytes: status.downloaded_bytes ?? 0,
      totalBytes: status.total_size_bytes ?? response.total_size_bytes ?? 0,
      estimatedCompletion: status.estimated_completion
    })
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('Aborted during download')
}

function buildRequest(
  testCase: TestCase,
  modelKey: string,
  defaultRunConfig?: RunConfig
): ChatRequest {
  const { input } = testCase
  const runConfig: RunConfig | undefined =
    testCase.runConfig || defaultRunConfig
      ? { ...defaultRunConfig, ...testCase.runConfig }
      : undefined
  const base: Partial<ChatRequest> = {
    model: modelKey,
    max_output_tokens: runConfig?.maxTokens,
    temperature: runConfig?.temperature,
    top_p: runConfig?.topP,
    top_k: runConfig?.topK,
    min_p: runConfig?.minP,
    repeat_penalty: runConfig?.repeatPenalty,
    frequency_penalty: runConfig?.frequencyPenalty,
    presence_penalty: runConfig?.presencePenalty,
    seed: runConfig?.seed
  }

  if (input.type === 'chat' && input.messages?.length) {
    const systemMsg = input.messages.find((m) => m.role === 'system')
    const userContent = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => m.content)
      .join('\n')

    return { ...base, model: modelKey, input: userContent, system_prompt: systemMsg?.content }
  }

  return { ...base, model: modelKey, input: input.prompt ?? '' }
}

function extractTextOutput(output: ChatResponse['output']): string {
  return output
    .filter((o) => o.type === 'message')
    .map((o) => (o as { type: 'message'; content: string }).content)
    .join('\n')
}

function computeAggregate(results: TestCaseResult[], testCases?: TestCase[]): AggregateMetrics {
  const passed = results.filter((r) => r.passed).length
  const tpsValues = results.flatMap((r) =>
    r.metrics.tokensPerSecond != null ? [r.metrics.tokensPerSecond] : []
  )
  const ttftValues = results.flatMap((r) =>
    r.metrics.timeToFirstTokenMs != null ? [r.metrics.timeToFirstTokenMs] : []
  )
  const avg = (arr: number[]): number | undefined =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined
  const min = (arr: number[]): number | undefined => (arr.length ? Math.min(...arr) : undefined)
  const max = (arr: number[]): number | undefined => (arr.length ? Math.max(...arr) : undefined)

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    avgTokensPerSecond: avg(tpsValues),
    minTokensPerSecond: min(tpsValues),
    maxTokensPerSecond: max(tpsValues),
    avgTimeToFirstTokenMs: avg(ttftValues),
    minTimeToFirstTokenMs: min(ttftValues),
    maxTimeToFirstTokenMs: max(ttftValues),
    avgScore: passed / (testCases ? testCases.length : results.length)
  }
}

export async function executeTestRun(
  run: TestRun,
  suite: TestSuite,
  send: SendEvent,
  signal: AbortSignal = new AbortController().signal
): Promise<void> {
  const runState: TestRun = structuredClone(run)
  const providerId = run.config.provider
  const provider = getProvider(providerId)
  const capabilities = provider.capabilities

  runState.status = 'running'
  runState.startedAt = new Date().toISOString()
  send(RUN.STARTED, { runId: run.id })
  console.log('[test-runner] Starting test run:', run, suite)

  let overallFailed = false

  if (
    capabilities.loadModel &&
    run.config.unloadModelsBeforeRun &&
    provider.fetchLocalModels &&
    provider.unloadModel
  ) {
    const selectedModelKeys = new Set(
      run.modelRuns
        .filter((mr) => mr.modelRef.source === 'installed')
        .map((mr) => (mr.modelRef as { source: 'installed'; modelKey: string }).modelKey)
    )
    try {
      const localModels = await provider.fetchLocalModels()
      for (const m of localModels) {
        if (selectedModelKeys.has(m.id)) continue
        for (const instance of m.loadedInstances) {
          await provider.unloadModel(instance.id)
        }
      }
    } catch (err) {
      console.error('[test-runner] Failed to unload models before run:', err)
    }
  }

  for (const modelRun of run.modelRuns) {
    if (signal.aborted) break

    const modelRunState = runState.modelRuns.find((m) => m.id === modelRun.id)!
    const results: TestCaseResult[] = []
    let fatalError: string | undefined
    let autoDownloaded = false

    try {
      const ref = modelRun.modelRef
      if (
        capabilities.downloadModel &&
        (ref.source === 'huggingface' || ref.source === 'registry')
      ) {
        modelRunState.status = 'downloading'
        const downloadTarget =
          ref.source === 'huggingface'
            ? toHuggingFaceUrl(extractHfModelId(ref.modelId))
            : ref.modelId
        autoDownloaded = await downloadAndPoll(
          providerId,
          modelRun.id,
          downloadTarget,
          send,
          signal
        )
      }
    } catch (err) {
      fatalError = err instanceof Error ? err.message : String(err)
      overallFailed = true
      modelRunState.status = signal.aborted ? 'cancelled' : 'failed'
      modelRunState.completedAt = new Date().toISOString()
      modelRunState.aggregate = computeAggregate(results, suite.testCases)
      modelRunState.error = fatalError
      send(RUN.MODEL_COMPLETED, {
        modelRunId: modelRun.id,
        status: modelRunState.status,
        aggregate: modelRunState.aggregate,
        error: fatalError
      })
      continue
    }

    if (signal.aborted) break

    modelRunState.status = 'running'
    modelRunState.autoDownloaded = autoDownloaded
    modelRunState.startedAt = new Date().toISOString()
    send(RUN.MODEL_STARTED, { modelRunId: modelRun.id, autoDownloaded })

    let modelKey: string
    if (modelRun.modelRef.source === 'installed') {
      modelKey = modelRun.modelRef.modelKey
    } else {
      const downloadId =
        modelRun.modelRef.source === 'huggingface'
          ? extractHfModelId(modelRun.modelRef.modelId)
          : modelRun.modelRef.modelId
      modelKey = await resolveModelKey(providerId, downloadId)
    }

    console.log('[test-runner] Starting model run:', modelRun)

    let modelInstanceId: string | undefined

    try {
      for (const testCase of suite.testCases) {
        if (signal.aborted) break

        const caseRunState = modelRunState.caseRuns.find((c) => c.testCaseId === testCase.id)!
        caseRunState.status = 'running'
        caseRunState.startedAt = new Date().toISOString()
        send(RUN.CASE_STARTED, { modelRunId: modelRun.id, testCaseId: testCase.id })
        console.log('[test-runner] Starting test case:', testCase)

        const request = buildRequest(testCase, modelKey, suite.defaultRunConfig)

        try {
          if (!provider.chat) throw new Error(`${providerId}: chat not supported`)
          const response = await provider.chat(request)
          if (!modelInstanceId) modelInstanceId = response.model_instance_id
          console.log(`[test-runner] ${run.id} / ${modelRun.id} / ${testCase.name}:`, response)

          const output = extractTextOutput(response.output)
          const evaluation = await evaluateAll(output, testCase)
          const result: TestCaseResult = {
            testCaseId: testCase.id,
            output,
            metrics: {
              tokensPerSecond: response.stats.tokens_per_second,
              timeToFirstTokenMs: response.stats.time_to_first_token_seconds * 1000,
              score: evaluation.score
            },
            passed: evaluation.passed,
            evalResults: evaluation.evalResults,
            error: evaluation.error
          }

          results.push(result)
          caseRunState.status = 'completed'
          caseRunState.completedAt = new Date().toISOString()
          caseRunState.result = result
          modelRunState.aggregate = computeAggregate(results)
          send(RUN.CASE_COMPLETED, {
            modelRunId: modelRun.id,
            testCaseId: testCase.id,
            result,
            aggregate: modelRunState.aggregate
          })
          console.log('[test-runner] Test case completed:', result)
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err)
          const result: TestCaseResult = {
            testCaseId: testCase.id,
            output: '',
            metrics: {},
            passed: false,
            evalResults: [],
            error
          }
          overallFailed = true
          results.push(result)
          caseRunState.status = 'completed'
          caseRunState.completedAt = new Date().toISOString()
          caseRunState.result = result
          modelRunState.aggregate = computeAggregate(results)
          send(RUN.CASE_COMPLETED, {
            modelRunId: modelRun.id,
            testCaseId: testCase.id,
            result,
            aggregate: modelRunState.aggregate
          })
          console.log('[test-runner] Test case completed with error:', result)
        }
      }
    } catch (err) {
      fatalError = err instanceof Error ? err.message : String(err)
      overallFailed = true
      console.log('[test-runner] Test case completed with fatal error:', fatalError)
    }

    const modelStatus: RunStatus = signal.aborted
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
    console.log('[test-runner] Model run completed:', modelRun)

    if (capabilities.loadModel && run.config.unloadModelsAfterRun && modelInstanceId) {
      try {
        if (!provider.unloadModel) throw new Error(`${providerId}: unloadModel not supported`)
        await provider.unloadModel(modelInstanceId)
      } catch (err) {
        console.error('[test-runner] Failed to unload model:', err)
      }
    }

    if (capabilities.deleteModel && autoDownloaded && run.config.deleteAutoDownloadedModels) {
      const ref = modelRun.modelRef
      try {
        if (ref.source === 'huggingface') {
          if (!provider.deleteModel) throw new Error(`${providerId}: deleteModel not supported`)
          await provider.deleteModel(modelKey)
          //if (!provider.deleteModelByHfId)
          //  throw new Error(`${providerId}: deleteModelByHfId not supported`)
          //await provider.deleteModelByHfId(extractHfModelId(ref.modelId))
        } else if (ref.source === 'registry') {
          if (!provider.deleteModel) throw new Error(`${providerId}: deleteModel not supported`)
          await provider.deleteModel(modelKey)
        }
      } catch (err) {
        console.error('[test-runner] Failed to delete auto-downloaded model:', err)
      }
    }
  }

  const finalStatus: RunStatus = signal.aborted
    ? 'cancelled'
    : overallFailed
      ? 'failed'
      : 'completed'
  runState.status = finalStatus
  runState.completedAt = new Date().toISOString()

  await saveTestRun(runState)
  send(RUN.COMPLETED, { runId: run.id, status: finalStatus })
  console.log('[test-runner] Test run completed:', run)
}
