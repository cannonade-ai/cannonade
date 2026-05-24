import { api } from '../api'
import type { TestRun, RunStatus } from '@shared/app/test-run'
import type { TestSuite, TestCase, TestCaseResult, AggregateMetrics } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type { ProviderId } from '@shared/provider/ids'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import { evaluateAll } from './evaluator'

export interface RunnerCallbacks {
  onRunStart(runId: string): void
  onModelDownloading(
    modelRunId: string,
    downloadedBytes: number,
    totalBytes: number,
    estimatedCompletion?: string
  ): void
  onModelRunStart(modelRunId: string, autoDownloaded: boolean): void
  onCaseStart(modelRunId: string, testCaseId: string): void
  onCaseComplete(
    modelRunId: string,
    testCaseId: string,
    result: TestCaseResult,
    aggregate: AggregateMetrics
  ): void
  onModelRunComplete(
    modelRunId: string,
    status: RunStatus,
    aggregate: AggregateMetrics,
    error?: string
  ): void
  onRunComplete(runId: string, status: RunStatus): void
}

const HF_BASE_URL = 'https://huggingface.co/'
const POLL_INTERVAL_MS = 1000

function toHuggingFaceUrl(modelId: string): string {
  return modelId.startsWith('https://') ? modelId : `${HF_BASE_URL}${modelId}`
}

function extractHfModelId(modelId: string): string {
  return modelId.startsWith(HF_BASE_URL) ? modelId.slice(HF_BASE_URL.length) : modelId
}

async function downloadAndPoll(
  providerId: ProviderId,
  modelRunId: string,
  hfModelId: string,
  callbacks: RunnerCallbacks,
  signal: AbortSignal
): Promise<boolean> {
  const modelUrl = toHuggingFaceUrl(hfModelId)
  const response = await api.downloadModel(providerId, modelUrl)

  if (response.status === 'already_downloaded') {
    return false
  }

  const jobId = response.job_id
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS / 2))
  while (!signal.aborted) {
    const status = await api.getDownloadStatus(providerId, jobId)
    if (status.status === 'completed') return true
    if (status.status === 'failed') throw new Error(`Download failed for ${hfModelId}`)
    callbacks.onModelDownloading(
      modelRunId,
      status.downloaded_bytes ?? 0,
      status.total_size_bytes ?? response.total_size_bytes ?? 0,
      status.estimated_completion
    )
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('Aborted during download')
}

function buildRequest(testCase: TestCase, modelKey: string): ChatRequest {
  const { input, runConfig } = testCase
  const base: Partial<ChatRequest> = {
    model: modelKey,
    temperature: runConfig?.temperature,
    top_p: runConfig?.topP,
    max_output_tokens: runConfig?.maxTokens
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
  callbacks: RunnerCallbacks,
  signal: AbortSignal = new AbortController().signal
): Promise<void> {
  const providerId = run.config.provider
  const capabilities: ProviderCapabilities = await api.getCapabilities(providerId)

  callbacks.onRunStart(run.id)
  console.log('[test-runner] Starting test run:', run, suite)

  let overallFailed = false

  for (const modelRun of run.modelRuns) {
    if (signal.aborted) break

    const results: TestCaseResult[] = []
    let fatalError: string | undefined
    let autoDownloaded = false

    try {
      if (capabilities.downloadModel && modelRun.modelRef.source === 'huggingface') {
        const hfModelId = extractHfModelId(modelRun.modelRef.modelId)
        autoDownloaded = await downloadAndPoll(
          providerId,
          modelRun.id,
          hfModelId,
          callbacks,
          signal
        )
      }
    } catch (err) {
      fatalError = err instanceof Error ? err.message : String(err)
      overallFailed = true
      callbacks.onModelRunComplete(
        modelRun.id,
        signal.aborted ? 'cancelled' : 'failed',
        computeAggregate(results, suite.testCases),
        fatalError
      )
      continue
    }

    if (signal.aborted) break

    callbacks.onModelRunStart(modelRun.id, autoDownloaded)

    let modelKey: string
    if (modelRun.modelRef.source === 'installed') {
      modelKey = modelRun.modelRef.modelKey
    } else {
      const hfModelId = extractHfModelId(modelRun.modelRef.modelId)
      const localModels = await api.fetchLocalModels(providerId)
      const match = localModels.find((m) => m.id.toLowerCase().includes(hfModelId.toLowerCase()))
      if (!match) throw new Error(`Downloaded model not found in provider: ${hfModelId}`)
      modelKey = match.id
    }

    console.log('[test-runner] Starting model run:', modelRun)

    let modelInstanceId: string | undefined

    try {
      for (const testCase of suite.testCases) {
        if (signal.aborted) break
        callbacks.onCaseStart(modelRun.id, testCase.id)
        console.log('[test-runner] Starting test case:', testCase)
        const request = buildRequest(testCase, modelKey)

        try {
          const response = await api.chat(providerId, modelKey, request)
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
          callbacks.onCaseComplete(modelRun.id, testCase.id, result, computeAggregate(results))
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
          results.push(result)
          callbacks.onCaseComplete(modelRun.id, testCase.id, result, computeAggregate(results))
          console.log('[test-runner] Test case completed with error:', result)
        }
      }
    } catch (err) {
      fatalError = err instanceof Error ? err.message : String(err)
      overallFailed = true
      console.log('[test-runner] Test case completed with fatal error:', fatalError)
    }

    const wasCancelled = signal.aborted
    callbacks.onModelRunComplete(
      modelRun.id,
      wasCancelled ? 'cancelled' : fatalError ? 'failed' : 'completed',
      computeAggregate(results, suite.testCases),
      fatalError
    )
    console.log('[test-runner] Model run completed:', modelRun)

    if (capabilities.loadModel && run.config.unloadModelsAfterRun && modelInstanceId) {
      try {
        await api.unloadModel(providerId, modelInstanceId)
      } catch (err) {
        console.error('[test-runner] Failed to unload model:', err)
      }
    }

    if (
      capabilities.deleteModel &&
      autoDownloaded &&
      run.config.deleteAutoDownloadedModels &&
      modelRun.modelRef.source === 'huggingface'
    ) {
      const hfModelId = extractHfModelId(modelRun.modelRef.modelId)
      try {
        await api.deleteModelByHfId(providerId, hfModelId)
      } catch (err) {
        console.error('[test-runner] Failed to delete auto-downloaded model:', err)
      }
    }
  }

  callbacks.onRunComplete(
    run.id,
    signal.aborted ? 'cancelled' : overallFailed ? 'failed' : 'completed'
  )
  console.log('[test-runner] Test run completed:', run)
}
