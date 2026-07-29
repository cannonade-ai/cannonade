import type {
  TestCase,
  TestCaseResult,
  TestCaseMetrics,
  AggregateMetrics,
  EvaluationMethodResult,
  RunCostBreakdown
} from '@shared/app/test-suite'
import type { JudgeUsage } from '@shared/app/judge'
import type { ChatStats } from '@shared/provider/chat'

export function sumJudgeUsage(evalResults: EvaluationMethodResult[]): JudgeUsage | undefined {
  const usages = evalResults.flatMap((r) => (r.judgeUsage ? [r.judgeUsage] : []))
  if (usages.length === 0) return undefined

  const total = (pick: (usage: JudgeUsage) => number | undefined): number | undefined => {
    const values = usages.flatMap((u) => {
      const value = pick(u)
      return value != null ? [value] : []
    })
    return values.length ? values.reduce((a, b) => a + b, 0) : undefined
  }

  return {
    model: usages[0].model,
    inputTokens: total((u) => u.inputTokens),
    outputTokens: total((u) => u.outputTokens),
    totalTokens: total((u) => u.totalTokens),
    cost: total((u) => u.cost)
  }
}

export function buildCaseMetrics(
  stats: ChatStats,
  score: number,
  durationMs: number,
  judgeUsage?: JudgeUsage
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
  if (judgeUsage) metrics.judgeUsage = judgeUsage

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
  const judgeCostValues = results.flatMap((r) =>
    r.metrics.judgeUsage?.cost != null ? [r.metrics.judgeUsage.cost] : []
  )
  const judgeTokenValues = results.flatMap((r) =>
    r.metrics.judgeUsage?.totalTokens != null ? [r.metrics.judgeUsage.totalTokens] : []
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
    totalJudgeCost: sum(judgeCostValues),
    totalJudgeTokens: sum(judgeTokenValues),
    avgScore: passed / (testCases ? testCases.length : results.length)
  }
}
