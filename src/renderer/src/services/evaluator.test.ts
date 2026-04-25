import { describe, it, expect } from 'vitest'
import { evaluate } from './evaluator'
import type { EvaluationConfig } from '@shared/app/test-suite'

describe('exact_match', () => {
  const base: EvaluationConfig = {
    type: 'exact_match',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes when output matches expected exactly', () => {
    const result = evaluate('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes when output matches after trimming whitespace', () => {
    const result = evaluate('  hello  ', { ...base, expected: 'hello' })
    expect(result.passed).toBe(true)
  })

  it('fails when output does not match', () => {
    const result = evaluate('hello', { ...base, expected: 'world' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })
})

describe('contains', () => {
  const base: EvaluationConfig = {
    type: 'contains',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes when all terms are found', () => {
    const result = evaluate('the cat sat on the mat', { ...base, expected: 'cat, mat' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
    expect(result.details).toBe('2/2 terms found')
  })

  it('returns partial score when only some terms are found', () => {
    const result = evaluate('the cat sat on the mat', { ...base, expected: 'cat, dog, mat' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeCloseTo(2 / 3)
    expect(result.details).toBe('2/3 terms found')
  })

  it('fails when no terms are found', () => {
    const result = evaluate('hello world', { ...base, expected: 'foo, bar' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns error when expected is empty', () => {
    const result = evaluate('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('regex', () => {
  const base: EvaluationConfig = {
    type: 'regex',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes when output matches the pattern', () => {
    const result = evaluate('order-1234', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('fails when output does not match the pattern', () => {
    const result = evaluate('order-abc', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('matches partial content within a longer string', () => {
    const result = evaluate('the price is $42.00 today', { ...base, expected: '\\$\\d+\\.\\d{2}' })
    expect(result.passed).toBe(true)
  })

  it('returns error for invalid regex', () => {
    const result = evaluate('anything', { ...base, expected: '[unclosed' })
    expect(result.passed).toBe(false)
    expect(result.error).toMatch(/invalid regex/i)
  })

  it('returns error when pattern is empty', () => {
    const result = evaluate('anything', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('rouge', () => {
  const base: EvaluationConfig = {
    type: 'rouge',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes with identical output and expected', () => {
    const result = evaluate('the quick brown fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes when output is a case-insensitive match', () => {
    const result = evaluate('THE QUICK BROWN FOX', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('returns partial score for partially overlapping output', () => {
    const result = evaluate('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeGreaterThan(0)
    expect(result.correctnessScore).toBeLessThan(1)
  })

  it('returns partial score for partially overlapping output 2', () => {
    const result = evaluate(
      `Two things are infinite, universe and human stupidity. I am not sure about the universe.`,
      {
        ...base,
        expected: `Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.`
      }
    )
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeGreaterThan(0)
    expect(result.correctnessScore).toBeLessThan(1)
  })

  it('returns zero score for completely different output', () => {
    const result = evaluate('completely different text', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.correctnessScore).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when expected is empty', () => {
    const result = evaluate('some output', { ...base, expected: '' })
    expect(result.correctnessScore).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluate('', { ...base, expected: 'some expected text' })
    expect(result.correctnessScore).toBe(0)
    expect(result.passed).toBe(false)
  })
})

describe('unknown type', () => {
  it('returns error for unimplemented type', () => {
    const config = {
      type: 'bleu',
      customValidator: { language: 'javascript' as const, code: '' },
      codeExecution: { language: 'javascript' as const, testCases: [] }
    } as EvaluationConfig
    const result = evaluate('output', config)
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
