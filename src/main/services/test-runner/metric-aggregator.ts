import type { TestCase, TestCaseResult, AggregateMetrics } from '@shared/app/test-suite'

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
