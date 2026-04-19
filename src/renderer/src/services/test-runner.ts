import { api } from '../api'
import type { TestRun, RunStatus } from '@shared/app/test-run'
import type { TestSuite, TestCase, TestCaseResult, AggregateMetrics } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

export interface RunnerCallbacks {
  onRunStart(runId: string): void
  onModelRunStart(modelRunId: string): void
  onCaseComplete(modelRunId: string, result: TestCaseResult): void
  onModelRunComplete(
    modelRunId: string,
    status: RunStatus,
    aggregate: AggregateMetrics,
    error?: string
  ): void
  onRunComplete(runId: string, status: RunStatus): void
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

function computeAggregate(results: TestCaseResult[]): AggregateMetrics {
  const passed = results.filter((r) => r.passed).length
  const tpsValues = results.flatMap((r) =>
    r.metrics.tokensPerSecond != null ? [r.metrics.tokensPerSecond] : []
  )
  const ttftValues = results.flatMap((r) =>
    r.metrics.timeToFirstTokenMs != null ? [r.metrics.timeToFirstTokenMs] : []
  )
  const avg = (arr: number[]): number | undefined =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    avgTokensPerSecond: avg(tpsValues),
    avgTimeToFirstTokenMs: avg(ttftValues)
  }
}

export async function executeTestRun(
  run: TestRun,
  suite: TestSuite,
  callbacks: RunnerCallbacks
): Promise<void> {
  callbacks.onRunStart(run.id)
  console.log('[test-runner] Starting test run:', run, suite)

  let overallFailed = false

  for (const modelRun of run.modelRuns) {
    callbacks.onModelRunStart(modelRun.id)

    const modelKey =
      modelRun.modelRef.source === 'installed'
        ? modelRun.modelRef.modelKey
        : modelRun.modelRef.modelId

    const results: TestCaseResult[] = []
    let fatalError: string | undefined

    console.log('[test-runner] Starting model run:', modelRun)

    try {
      for (const testCase of suite.testCases) {
        console.log('[test-runner] Starting test case:', testCase)
        const request = buildRequest(testCase, modelKey)

        try {
          const response = await api.lmStudioChat(request)
          console.log(`[test-runner] ${run.id} / ${modelRun.id} / ${testCase.name}:`, response)

          const result: TestCaseResult = {
            testCaseId: testCase.id,
            output: extractTextOutput(response.output),
            metrics: {
              tokensPerSecond: response.stats.tokens_per_second,
              timeToFirstTokenMs: response.stats.time_to_first_token_seconds * 1000
            },
            passed: true
          }

          results.push(result)
          callbacks.onCaseComplete(modelRun.id, result)
          console.log('[test-runner] Test case completed:', result)
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err)
          const result: TestCaseResult = {
            testCaseId: testCase.id,
            output: '',
            metrics: {},
            passed: false,
            error
          }
          results.push(result)
          callbacks.onCaseComplete(modelRun.id, result)
          console.log('[test-runner] Test case completed with error:', result)
        }
      }
    } catch (err) {
      fatalError = err instanceof Error ? err.message : String(err)
      overallFailed = true
      console.log('[test-runner] Test case completed with fatal error:', fatalError)
    }

    callbacks.onModelRunComplete(
      modelRun.id,
      fatalError ? 'failed' : 'completed',
      computeAggregate(results),
      fatalError
    )
    console.log('[test-runner] Model run completed:', modelRun)
  }

  callbacks.onRunComplete(run.id, overallFailed ? 'failed' : 'completed')
  console.log('[test-runner] Test run completed:', run)
}
