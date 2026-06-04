import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluate } from './evaluator'
import type { EvaluationConfig } from '@shared/app/test-suite'

vi.mock('./metrics', () => ({
  evaluateExactMatch: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateContains: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateNotContains: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateRegex: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateRouge: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateLevenshtein: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateF1: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateJsonMatch: vi.fn().mockResolvedValue({ passed: true, score: 1 }),
  evaluateBleu: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

vi.mock('./customValidator', () => ({
  runCustomValidator: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

vi.mock('./cosineSimilarity', () => ({
  runCosineSimilarity: vi.fn().mockResolvedValue({ passed: true, score: 1 })
}))

import {
  evaluateExactMatch,
  evaluateContains,
  evaluateNotContains,
  evaluateRegex,
  evaluateRouge,
  evaluateLevenshtein,
  evaluateF1,
  evaluateJsonMatch,
  evaluateBleu
} from './metrics'
import { runCustomValidator } from './customValidator'
import { runCosineSimilarity } from './cosineSimilarity'

const OUTPUT = 'test output'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('evaluate routing', () => {
  const cases: Array<[EvaluationConfig['type'], unknown]> = [
    ['exact_match', evaluateExactMatch],
    ['contains', evaluateContains],
    ['not_contains', evaluateNotContains],
    ['regex', evaluateRegex],
    ['rouge', evaluateRouge],
    ['levenshtein', evaluateLevenshtein],
    ['f1', evaluateF1],
    ['json_match', evaluateJsonMatch],
    ['bleu', evaluateBleu],
    ['custom', runCustomValidator],
    ['cosine_similarity', runCosineSimilarity]
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
