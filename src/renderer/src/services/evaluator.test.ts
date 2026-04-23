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
