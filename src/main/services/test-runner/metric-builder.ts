import type {
  TestCase,
  TestCaseResult,
  TestCaseMetrics,
  AggregateMetrics,
  RunCostBreakdown
} from '@shared/app/test-suite'
import type { ChatStats } from '@shared/provider/chat'

export function buildCaseMetrics(
  stats: ChatStats,
  score: number,
  durationMs: number
): TestCaseMetrics {
  const metrics: TestCaseMetrics = {
    tokensPerSecond: stats.tokens_per_second,
    timeToFirstTokenMs: stats.time_to_first_token_seconds * 1000,
    score,
    durationMs,
    inputTokens: stats.input_tokens,
    outputTokens: stats.total_output_tokens,
    totalTokens: stats.input_tokens + stats.total_output_tokens,
    reasoningTokens: stats.reasoning_output_tokens
  }
  if (stats.cached_input_tokens) metrics.cachedInputTokens = stats.cached_input_tokens
  if (stats.cost != null) metrics.cost = stats.cost

  const breakdown: RunCostBreakdown = {}
  if (stats.cost_details?.upstream_inference_prompt_cost != null) {
    breakdown.promptCost = stats.cost_details.upstream_inference_prompt_cost
  }
  if (stats.cost_details?.upstream_inference_completions_cost != null) {
    breakdown.completionCost = stats.cost_details.upstream_inference_completions_cost
  }
  if (Object.keys(breakdown).length > 0) metrics.costBreakdown = breakdown

  return metrics
}

export function computeAggregate(
  results: TestCaseResult[],
  testCases?: TestCase[]
): AggregateMetrics {
  const passed = results.filter((r) => r.passed).length
  const tpsValues = results.flatMap((r) =>
    r.metrics.tokensPerSecond != null ? [r.metrics.tokensPerSecond] : []
  )
  const ttftValues = results.flatMap((r) =>
    r.metrics.timeToFirstTokenMs != null ? [r.metrics.timeToFirstTokenMs] : []
  )
  const durationValues = results.flatMap((r) =>
    r.metrics.durationMs != null ? [r.metrics.durationMs] : []
  )
  const costValues = results.flatMap((r) => (r.metrics.cost != null ? [r.metrics.cost] : []))
  const tokenValues = results.flatMap((r) =>
    r.metrics.totalTokens != null ? [r.metrics.totalTokens] : []
  )
  const avg = (arr: number[]): number | undefined =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined
  const min = (arr: number[]): number | undefined => (arr.length ? Math.min(...arr) : undefined)
  const max = (arr: number[]): number | undefined => (arr.length ? Math.max(...arr) : undefined)
  const sum = (arr: number[]): number | undefined =>
    arr.length ? arr.reduce((a, b) => a + b, 0) : undefined

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
    avgDurationMs: avg(durationValues),
    minDurationMs: min(durationValues),
    maxDurationMs: max(durationValues),
    totalDurationMs: sum(durationValues),
    totalCost: sum(costValues),
    totalTokens: sum(tokenValues),
    avgScore: passed / (testCases ? testCases.length : results.length)
  }
}
