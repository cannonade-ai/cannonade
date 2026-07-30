import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluate, evaluateAll } from './evaluator'
import type { TestCase } from '@shared/app/test-suite'
import type { EvaluationConfig } from '@shared/app/test-suite'

vi.mock('./metrics', () => ({
  evaluateExactMatch: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateContains: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateRegex: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateRouge: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateLevenshtein: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateF1: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateJsonMatch: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateBleu: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  PASS_THRESHOLD: 0.9
}))

vi.mock('./customValidator', () => ({
  runCustomValidator: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

vi.mock('./cosineSimilarity', () => ({
  runCosineSimilarity: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

vi.mock('./html-validation', () => ({
  evaluateHtmlValidation: vi.fn().mockReturnValue({ passed: true, score: 1 })
}))

vi.mock('./llm-rubric', () => ({
  evaluateLlmRubric: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

vi.mock('./g-eval', () => ({
  evaluateGEval: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

import {
  evaluateExactMatch,
  evaluateContains,
  evaluateRegex,
  evaluateRouge,
  evaluateLevenshtein,
  evaluateF1,
  evaluateJsonMatch,
  evaluateBleu
} from './metrics'
import { runCustomValidator } from './customValidator'
import { runCosineSimilarity } from './cosineSimilarity'
import { evaluateHtmlValidation } from './html-validation'
import { evaluateLlmRubric } from './llm-rubric'
import { evaluateGEval } from './g-eval'

const OUTPUT = 'test output'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('evaluate routing', () => {
  const cases: Array<[EvaluationConfig['type'], unknown]> = [
    ['exact_match', evaluateExactMatch],
    ['contains', evaluateContains],
    ['regex', evaluateRegex],
    ['rouge', evaluateRouge],
    ['levenshtein', evaluateLevenshtein],
    ['f1', evaluateF1],
    ['json_match', evaluateJsonMatch],
    ['bleu', evaluateBleu],
    ['custom', runCustomValidator],
    ['cosine_similarity', runCosineSimilarity],
    ['html_validation', evaluateHtmlValidation]
  ]

  for (const [type, fn] of cases) {
    it(`routes "${type}" to the correct function`, async () => {
      await evaluate(OUTPUT, { type } as EvaluationConfig)
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(OUTPUT, { type })
    })
  }

  it('routes "llm_rubric" to the judge, forwarding the evaluation context', async () => {
    const context = { input: 'question', abortSignal: new AbortController().signal }
    await evaluate(OUTPUT, { type: 'llm_rubric' }, context)
    expect(evaluateLlmRubric).toHaveBeenCalledWith(OUTPUT, { type: 'llm_rubric' }, context)
  })

  it('routes "g_eval" to the judge, forwarding the evaluation context', async () => {
    const context = { input: 'question', abortSignal: new AbortController().signal }
    await evaluate(OUTPUT, { type: 'g_eval' }, context)
    expect(evaluateGEval).toHaveBeenCalledWith(OUTPUT, { type: 'g_eval' }, context)
  })

  it('returns an error for an unknown type', async () => {
    const config = { type: 'unknown_type' } as unknown as EvaluationConfig
    const result = await evaluate(OUTPUT, config)
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('evaluateAll context', () => {
  function makeTestCase(input: TestCase['input']): TestCase {
    return {
      id: 'tc-1',
      name: 'Test Case 1',
      input,
      evaluations: [{ type: 'llm_rubric' }],
      passingLogic: 'all'
    }
  }

  it('derives the input from chat messages, skipping the system prompt', async () => {
    const testCase = makeTestCase({
      type: 'chat',
      messages: [
        { role: 'system', content: 'You are terse.' },
        { role: 'user', content: 'What is 6 times 7?' }
      ]
    })

    await evaluateAll(OUTPUT, testCase)

    expect(evaluateLlmRubric).toHaveBeenCalledWith(
      OUTPUT,
      testCase.evaluations[0],
      expect.objectContaining({ input: 'What is 6 times 7?' })
    )
  })

  it('falls back to the completion prompt', async () => {
    const testCase = makeTestCase({ type: 'completion', prompt: 'Say hello' })

    await evaluateAll(OUTPUT, testCase)

    expect(evaluateLlmRubric).toHaveBeenCalledWith(
      OUTPUT,
      testCase.evaluations[0],
      expect.objectContaining({ input: 'Say hello' })
    )
  })

  it('keeps the abort signal from the caller', async () => {
    const abortSignal = new AbortController().signal

    await evaluateAll(OUTPUT, makeTestCase({ type: 'completion', prompt: 'Say hello' }), {
      abortSignal
    })

    expect(evaluateLlmRubric).toHaveBeenCalledWith(
      OUTPUT,
      expect.anything(),
      expect.objectContaining({ abortSignal })
    )
  })
})

describe('negate', () => {
  it('inverts a passing result into a failing one', async () => {
    vi.mocked(evaluateRegex).mockResolvedValueOnce({ passed: true, score: 1 })
    const result = await evaluate(OUTPUT, { type: 'regex', negate: true })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('inverts a failing result into a passing one', async () => {
    vi.mocked(evaluateRegex).mockResolvedValueOnce({ passed: false, score: 0 })
    const result = await evaluate(OUTPUT, { type: 'regex', negate: true })
    expect(result.score).toBe(1)
    expect(result.passed).toBe(true)
  })

  it('recomputes passed against the threshold for similarity scores', async () => {
    vi.mocked(evaluateContains).mockResolvedValueOnce({ passed: false, score: 0.5 })
    const result = await evaluate(OUTPUT, { type: 'contains', negate: true })
    expect(result.score).toBe(0.5)
    expect(result.passed).toBe(false)
  })

  it('uses a provided threshold when negating', async () => {
    vi.mocked(evaluateContains).mockResolvedValueOnce({ passed: false, score: 0.5 })
    const result = await evaluate(OUTPUT, { type: 'contains', negate: true, threshold: 0.4 })
    expect(result.score).toBe(0.5)
    expect(result.passed).toBe(true)
  })

  it('inverts a failing html_validation result and keeps its reason', async () => {
    vi.mocked(evaluateHtmlValidation).mockReturnValueOnce({
      passed: false,
      score: 0,
      details: 'Output has text outside of any HTML element'
    })
    const result = await evaluate(OUTPUT, { type: 'html_validation', negate: true })
    expect(result.score).toBe(1)
    expect(result.passed).toBe(true)
    expect(result.details).toBe('Output has text outside of any HTML element')
  })

  it('does not negate a result that errored', async () => {
    vi.mocked(evaluateRegex).mockResolvedValueOnce({
      passed: false,
      score: 0,
      error: 'Invalid regex pattern'
    })
    const result = await evaluate(OUTPUT, { type: 'regex', negate: true })
    expect(result.error).toBeTruthy()
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })
})
