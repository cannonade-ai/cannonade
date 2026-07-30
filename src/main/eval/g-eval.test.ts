import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'

vi.mock('./judge/judge-client', async () => {
  const actual =
    await vi.importActual<typeof import('./judge/judge-client')>('./judge/judge-client')
  return { ...actual, callJudge: vi.fn() }
})

import { buildEvaluateMessages, buildStepsMessages, evaluateGEval } from './g-eval'
import { callJudge, JudgeError } from './judge/judge-client'

const judge = vi.mocked(callJudge)

const STEPS_USAGE = {
  model: 'judge-model',
  inputTokens: 10,
  outputTokens: 20,
  totalTokens: 30,
  cost: 0.01
}

const VERDICT_USAGE = {
  model: 'judge-model',
  inputTokens: 40,
  outputTokens: 5,
  totalTokens: 45,
  cost: 0.02
}

const SUMMED_USAGE = {
  model: 'judge-model',
  inputTokens: 50,
  outputTokens: 25,
  totalTokens: 75,
  cost: 0.03
}

const STEPS_CONTENT = '{"steps":["Check tone","Check the answer","Check for disclaimers"]}'

function gEvalConfig(criteria: string[], threshold?: number): EvaluationConfig {
  return { type: 'g_eval', gEval: { criteria }, threshold }
}

function mockBothCalls(verdictContent: string): void {
  judge
    .mockResolvedValueOnce({ content: STEPS_CONTENT, usage: STEPS_USAGE })
    .mockResolvedValueOnce({ content: verdictContent, usage: VERDICT_USAGE })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildStepsMessages', () => {
  it('sends only the criteria', () => {
    const messages = buildStepsMessages(['is polite', 'answers the question'])

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].content).toBe('<Criteria>\nis polite\nanswers the question\n</Criteria>')
  })
})

describe('buildEvaluateMessages', () => {
  it('sends criteria, steps and output', () => {
    const messages = buildEvaluateMessages(['is polite'], ['Check tone'], 'Hello there')

    expect(messages[1].content).toContain('<Criteria>\nis polite\n</Criteria>')
    expect(messages[1].content).toContain('<Steps>\n- Check tone\n</Steps>')
    expect(messages[1].content).toContain('<Output>\nHello there\n</Output>')
    expect(messages[1].content).not.toContain('<Input>')
  })

  it('includes the input section when an input is available', () => {
    const messages = buildEvaluateMessages(['is correct'], ['Check math'], '42', 'What is 6 * 7?')

    expect(messages[1].content).toContain('<Input>\nWhat is 6 * 7?\n</Input>')
  })
})

describe('evaluateGEval', () => {
  it('makes two judge calls and passes when the judge grades the output as passing', async () => {
    mockBothCalls('{"score":0.9,"reason":"clear and polite","passed":true}')

    const result = await evaluateGEval('Thanks for asking!', gEvalConfig(['is polite']))

    expect(judge).toHaveBeenCalledTimes(2)
    expect(result.score).toBe(0.9)
    expect(result.passed).toBe(true)
    expect(result.details).toBe('clear and polite')
  })

  it('feeds the generated steps into the second call', async () => {
    mockBothCalls('{"score":1,"reason":"ok","passed":true}')

    await evaluateGEval('out', gEvalConfig(['is polite']), { input: 'hi' })

    const stepsMessages = judge.mock.calls[0][0]
    expect(stepsMessages[1].content).not.toContain('<Output>')

    const evaluateMessages = judge.mock.calls[1][0]
    expect(evaluateMessages[1].content).toContain(
      '<Steps>\n- Check tone\n- Check the answer\n- Check for disclaimers\n</Steps>'
    )
    expect(evaluateMessages[1].content).toContain('<Input>\nhi\n</Input>')
    expect(evaluateMessages[1].content).toContain('<Output>\nout\n</Output>')
  })

  it('sums tokens and cost across both calls', async () => {
    mockBothCalls('{"score":1,"reason":"ok","passed":true}')

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.judgeUsage).toEqual(SUMMED_USAGE)
  })

  it('accepts steps and a verdict wrapped in code fences', async () => {
    judge
      .mockResolvedValueOnce({
        content: '```json\n{"steps":["Check tone"]}\n```',
        usage: STEPS_USAGE
      })
      .mockResolvedValueOnce({
        content: '```json\n{"score":0.5,"reason":"partly","passed":true}\n```',
        usage: VERDICT_USAGE
      })

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.score).toBe(0.5)
    expect(result.passed).toBe(true)
  })

  it('errors when the steps response is malformed JSON', async () => {
    judge.mockResolvedValueOnce({ content: '{"steps": ["unterminated', usage: STEPS_USAGE })

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(judge).toHaveBeenCalledTimes(1)
    expect(result.error).toContain('unparseable steps')
    expect(result.passed).toBe(false)
    expect(result.judgeUsage).toEqual(STEPS_USAGE)
  })

  it('errors when the steps list is empty', async () => {
    judge.mockResolvedValueOnce({ content: '{"steps":[]}', usage: STEPS_USAGE })

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(judge).toHaveBeenCalledTimes(1)
    expect(result.error).toContain('unparseable steps')
  })

  it('drops non-string and blank steps', async () => {
    judge
      .mockResolvedValueOnce({
        content: '{"steps":["Check tone",42,"","   ",null,"Check the answer"]}',
        usage: STEPS_USAGE
      })
      .mockResolvedValueOnce({
        content: '{"score":1,"reason":"ok","passed":true}',
        usage: VERDICT_USAGE
      })

    await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(judge.mock.calls[1][0][1].content).toContain(
      '<Steps>\n- Check tone\n- Check the answer\n</Steps>'
    )
  })

  it('errors when every step is non-string', async () => {
    judge.mockResolvedValueOnce({ content: '{"steps":[1,2,3]}', usage: STEPS_USAGE })

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(judge).toHaveBeenCalledTimes(1)
    expect(result.error).toContain('unparseable steps')
  })

  it('errors when the verdict response is malformed JSON', async () => {
    mockBothCalls('Looks good to me!')

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.error).toContain('unparseable output')
    expect(result.passed).toBe(false)
    expect(result.judgeUsage).toEqual(SUMMED_USAGE)
  })

  it('clamps a score above the valid range', async () => {
    mockBothCalls('{"score":5,"reason":"great","passed":true}')

    expect((await evaluateGEval('out', gEvalConfig(['is polite']))).score).toBe(1)
  })

  it('clamps a score below the valid range', async () => {
    mockBothCalls('{"score":-2,"reason":"bad","passed":false}')

    expect((await evaluateGEval('out', gEvalConfig(['is polite']))).score).toBe(0)
  })

  it('accepts a score sent as a string', async () => {
    mockBothCalls('{"score":"0.75","reason":"mostly","passed":true}')

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.score).toBe(0.75)
    expect(result.passed).toBe(true)
  })

  it('keeps the verdict when the reason is missing', async () => {
    mockBothCalls('{"score":0.8,"passed":true}')

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.score).toBe(0.8)
    expect(result.passed).toBe(true)
    expect(result.details).toBeUndefined()
    expect(result.error).toBeUndefined()
  })

  it('honours the configured threshold', async () => {
    mockBothCalls('{"score":0.6,"passed":true}')
    expect((await evaluateGEval('out', gEvalConfig(['c'], 0.5))).passed).toBe(true)

    vi.clearAllMocks()
    mockBothCalls('{"score":0.6,"passed":true}')
    expect((await evaluateGEval('out', gEvalConfig(['c'], 0.8))).passed).toBe(false)
  })

  it('explains a threshold failure when the judge gave no reason', async () => {
    mockBothCalls('{"score":0.4,"passed":true}')

    const result = await evaluateGEval('out', gEvalConfig(['c'], 0.8))

    expect(result.details).toBe('Score 0.4 below threshold 0.8.')
  })

  it('reports an errored eval when the steps call fails', async () => {
    judge.mockRejectedValueOnce(new JudgeError('Judge request failed: fetch failed'))

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(judge).toHaveBeenCalledTimes(1)
    expect(result.error).toBe('Judge request failed: fetch failed')
    expect(result.passed).toBe(false)
    expect(result.judgeUsage).toBeUndefined()
  })

  it('keeps the steps usage when the evaluate call fails', async () => {
    judge
      .mockResolvedValueOnce({ content: STEPS_CONTENT, usage: STEPS_USAGE })
      .mockRejectedValueOnce(new JudgeError('Judge request failed: fetch failed'))

    const result = await evaluateGEval('out', gEvalConfig(['is polite']))

    expect(result.error).toBe('Judge request failed: fetch failed')
    expect(result.judgeUsage).toEqual(STEPS_USAGE)
  })

  it('rethrows fatal judge errors so the run can fail', async () => {
    judge.mockRejectedValue(new JudgeError('No judge model configured.', true))

    await expect(evaluateGEval('out', gEvalConfig(['is polite']))).rejects.toThrow(
      'No judge model configured.'
    )
  })

  it('rethrows cancellations so the run can record them', async () => {
    judge.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(evaluateGEval('out', gEvalConfig(['is polite']))).rejects.toThrow('Aborted')
  })

  it('errors when the criteria array is empty', async () => {
    const result = await evaluateGEval('out', gEvalConfig([]))

    expect(result.error).toBe('No criteria provided')
    expect(judge).not.toHaveBeenCalled()
  })

  it('errors when no criteria are configured at all', async () => {
    const result = await evaluateGEval('out', { type: 'g_eval' })

    expect(result.error).toBe('No criteria provided')
    expect(judge).not.toHaveBeenCalled()
  })

  it('errors when every criterion is blank', async () => {
    const result = await evaluateGEval('out', gEvalConfig(['', '   ']))

    expect(result.error).toBe('No criteria provided')
    expect(judge).not.toHaveBeenCalled()
  })

  it('errors when the model output is not a string', async () => {
    const result = await evaluateGEval(undefined as unknown as string, gEvalConfig(['is polite']))

    expect(result.error).toBe('Model output was empty')
    expect(judge).not.toHaveBeenCalled()
  })

  it('errors when the model output is empty', async () => {
    const result = await evaluateGEval('   ', gEvalConfig(['is polite']))

    expect(result.error).toBe('Model output was empty')
    expect(judge).not.toHaveBeenCalled()
  })

  it('interpolates output and input placeholders in the criteria', async () => {
    mockBothCalls('{"score":1,"passed":true}')

    await evaluateGEval('blue', gEvalConfig(['says the same color as {{input}}']), {
      input: 'blue'
    })

    expect(judge.mock.calls[0][0][1].content).toContain(
      '<Criteria>\nsays the same color as blue\n</Criteria>'
    )
  })

  it('forwards the abort signal to both calls', async () => {
    mockBothCalls('{"score":1,"passed":true}')
    const abortSignal = new AbortController().signal

    await evaluateGEval('out', gEvalConfig(['is polite']), { abortSignal })

    expect(judge).toHaveBeenNthCalledWith(1, expect.any(Array), abortSignal)
    expect(judge).toHaveBeenNthCalledWith(2, expect.any(Array), abortSignal)
  })
})
