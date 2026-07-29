import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'

vi.mock('./judge/judge-client', async () => {
  const actual =
    await vi.importActual<typeof import('./judge/judge-client')>('./judge/judge-client')
  return { ...actual, callJudge: vi.fn() }
})

import { buildRubricMessages, evaluateLlmRubric } from './llm-rubric'
import { callJudge, JudgeError } from './judge/judge-client'

const judge = vi.mocked(callJudge)

const USAGE = {
  model: 'judge-model',
  inputTokens: 10,
  outputTokens: 5,
  totalTokens: 15,
  cost: 0.02
}

function rubricConfig(rubric: string, threshold?: number): EvaluationConfig {
  return { type: 'llm_rubric', llmRubric: { rubric }, threshold }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildRubricMessages', () => {
  it('wraps the output and rubric in tagged sections', () => {
    const messages = buildRubricMessages('Hello world', 'Content contains a greeting')
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].content).toContain('<Output>\nHello world\n</Output>')
    expect(messages[1].content).toContain('<Rubric>\nContent contains a greeting\n</Rubric>')
    expect(messages[1].content).not.toContain('<Input>')
  })

  it('includes the input section when an input is available', () => {
    const messages = buildRubricMessages('42', 'Answers the question', 'What is 6 times 7?')
    expect(messages[1].content).toContain('<Input>\nWhat is 6 times 7?\n</Input>')
  })

  it('interpolates output and input placeholders in the rubric', () => {
    const messages = buildRubricMessages('blue', 'Says the same color as {{input}}', 'blue')
    expect(messages[1].content).toContain('<Rubric>\nSays the same color as blue\n</Rubric>')
  })
})

describe('evaluateLlmRubric', () => {
  it('passes when the judge grades the output as passing', async () => {
    judge.mockResolvedValue({
      content: '{"reason": "it is polite", "pass": true, "score": 1.0}',
      usage: USAGE
    })

    const result = await evaluateLlmRubric('Thanks for asking!', rubricConfig('is polite'))

    expect(result).toEqual({
      score: 1,
      passed: true,
      details: 'it is polite',
      judgeUsage: USAGE
    })
  })

  it('fails without an error when the judge grades the output as failing', async () => {
    judge.mockResolvedValue({
      content: '{"reason": "it is rude", "pass": false, "score": 0.0}',
      usage: USAGE
    })

    const result = await evaluateLlmRubric('Go away.', rubricConfig('is polite'))

    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.error).toBeUndefined()
    expect(result.details).toBe('it is rude')
  })

  it('honours the configured threshold', async () => {
    judge.mockResolvedValue({ content: '{"pass": true, "score": 0.6}', usage: USAGE })

    expect((await evaluateLlmRubric('out', rubricConfig('rubric', 0.5))).passed).toBe(true)
    expect((await evaluateLlmRubric('out', rubricConfig('rubric', 0.8))).passed).toBe(false)
  })

  it('passes on the verdict alone when no threshold is configured', async () => {
    judge.mockResolvedValue({ content: '{"pass": true, "score": 0.2}', usage: USAGE })

    const result = await evaluateLlmRubric('out', rubricConfig('is polite'))

    expect(result.passed).toBe(true)
    expect(result.score).toBe(0.2)
  })

  it('never lets a threshold rescue a failed verdict', async () => {
    judge.mockResolvedValue({ content: '{"pass": false, "score": 0.95}', usage: USAGE })

    expect((await evaluateLlmRubric('out', rubricConfig('rubric', 0.5))).passed).toBe(false)
  })

  it('treats a missing pass field as passing', async () => {
    judge.mockResolvedValue({ content: '{"score": 0.3}', usage: USAGE })

    expect((await evaluateLlmRubric('out', rubricConfig('is polite'))).passed).toBe(true)
  })

  it('explains a threshold failure when the judge gave no reason', async () => {
    judge.mockResolvedValue({ content: '{"pass": true, "score": 0.4}', usage: USAGE })

    const result = await evaluateLlmRubric('out', rubricConfig('rubric', 0.8))

    expect(result.details).toBe('Score 0.4 below threshold 0.8.')
  })

  it('keeps the judge reason when the threshold fails it', async () => {
    judge.mockResolvedValue({
      content: '{"pass": true, "score": 0.4, "reason": "only partly on topic"}',
      usage: USAGE
    })

    const result = await evaluateLlmRubric('out', rubricConfig('rubric', 0.8))

    expect(result.passed).toBe(false)
    expect(result.details).toBe('only partly on topic')
  })

  it('reports an errored eval when the judge output cannot be parsed', async () => {
    judge.mockResolvedValue({ content: 'Looks good to me!', usage: USAGE })

    const result = await evaluateLlmRubric('out', rubricConfig('is polite'))

    expect(result.error).toContain('unparseable')
    expect(result.passed).toBe(false)
    expect(result.judgeUsage).toEqual(USAGE)
  })

  it('reports an errored eval when the judge call fails', async () => {
    judge.mockRejectedValue(new JudgeError('Judge request failed: fetch failed'))

    const result = await evaluateLlmRubric('out', rubricConfig('is polite'))

    expect(result.error).toBe('Judge request failed: fetch failed')
    expect(result.passed).toBe(false)
    expect(result.judgeUsage).toBeUndefined()
  })

  it('rethrows fatal judge errors so the run can fail', async () => {
    judge.mockRejectedValue(new JudgeError('No judge model configured.', true))

    await expect(evaluateLlmRubric('out', rubricConfig('is polite'))).rejects.toThrow(
      'No judge model configured.'
    )
  })

  it('rethrows cancellations so the run can record them', async () => {
    judge.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(evaluateLlmRubric('out', rubricConfig('is polite'))).rejects.toThrow('Aborted')
  })

  it('errors when no rubric is configured', async () => {
    const result = await evaluateLlmRubric('out', { type: 'llm_rubric' })

    expect(result.error).toBe('No rubric provided')
    expect(judge).not.toHaveBeenCalled()
  })

  it('errors when the model output is empty', async () => {
    const result = await evaluateLlmRubric('   ', rubricConfig('is polite'))

    expect(result.error).toBe('Model output was empty')
    expect(judge).not.toHaveBeenCalled()
  })

  it('forwards the abort signal and input to the judge', async () => {
    judge.mockResolvedValue({ content: '{"pass": true, "score": 1}', usage: USAGE })
    const abortSignal = new AbortController().signal

    await evaluateLlmRubric('out', rubricConfig('is polite'), { input: 'hi', abortSignal })

    expect(judge).toHaveBeenCalledWith(expect.any(Array), abortSignal)
    expect(judge.mock.calls[0][0][1].content).toContain('<Input>\nhi\n</Input>')
  })
})
