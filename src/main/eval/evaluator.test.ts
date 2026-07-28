import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluate } from './evaluator'
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

  it('returns an error for an unknown type', async () => {
    const config = { type: 'unknown_type' } as unknown as EvaluationConfig
    const result = await evaluate(OUTPUT, config)
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
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
