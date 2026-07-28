import { describe, it, expect } from 'vitest'
import type { EvaluationMethodResult, TestCaseResult } from '@shared/app/test-suite'
import type { ChatStats } from '@shared/provider/chat'
import { buildCaseMetrics, computeAggregate, sumJudgeUsage } from './metric-builder'

const STATS: ChatStats = {
  input_tokens: 10,
  total_output_tokens: 20,
  reasoning_output_tokens: 0,
  tokens_per_second: 50,
  time_to_first_token_seconds: 0.1,
  cost: 0.5
}

function judged(cost: number, totalTokens: number): EvaluationMethodResult {
  return {
    type: 'llm_rubric',
    score: 1,
    passed: true,
    judge: { model: 'judge-model', totalTokens, cost }
  }
}

function caseResult(metrics: TestCaseResult['metrics']): TestCaseResult {
  return { testCaseId: 'tc', output: '', metrics, passed: true, evalResults: [] }
}

describe('sumJudgeUsage', () => {
  it('returns undefined when no eval was graded by a judge', () => {
    expect(sumJudgeUsage([{ type: 'contains', score: 1, passed: true }])).toBeUndefined()
  })

  it('sums usage across every judged eval', () => {
    const usage = sumJudgeUsage([
      judged(0.02, 15),
      { type: 'contains', score: 1, passed: true },
      judged(0.03, 25)
    ])

    expect(usage).toEqual({
      model: 'judge-model',
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: 40,
      cost: 0.05
    })
  })
})

describe('buildCaseMetrics', () => {
  it('keeps judge usage out of the model totals', () => {
    const metrics = buildCaseMetrics(STATS, 1, 250, {
      model: 'judge-model',
      totalTokens: 15,
      cost: 0.02
    })

    expect(metrics.totalTokens).toBe(30)
    expect(metrics.cost).toBe(0.5)
    expect(metrics.judge).toEqual({ model: 'judge-model', totalTokens: 15, cost: 0.02 })
  })

  it('omits judge usage when nothing was graded by a judge', () => {
    expect(buildCaseMetrics(STATS, 1, 250).judge).toBeUndefined()
  })
})

describe('computeAggregate', () => {
  it('totals judge cost and tokens separately from the model totals', () => {
    const aggregate = computeAggregate([
      caseResult({
        totalTokens: 30,
        cost: 0.5,
        judge: { model: 'j', totalTokens: 15, cost: 0.02 }
      }),
      caseResult({ totalTokens: 40, cost: 0.7, judge: { model: 'j', totalTokens: 25, cost: 0.03 } })
    ])

    expect(aggregate.totalTokens).toBe(70)
    expect(aggregate.totalCost).toBeCloseTo(1.2)
    expect(aggregate.totalJudgeTokens).toBe(40)
    expect(aggregate.totalJudgeCost).toBeCloseTo(0.05)
  })

  it('leaves the judge totals undefined when no case was judged', () => {
    const aggregate = computeAggregate([caseResult({ totalTokens: 30, cost: 0.5 })])

    expect(aggregate.totalJudgeTokens).toBeUndefined()
    expect(aggregate.totalJudgeCost).toBeUndefined()
  })
})
