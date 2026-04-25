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

describe('levenshtein', () => {
  const base: EvaluationConfig = {
    type: 'levenshtein',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes with identical output and expected', () => {
    const result = evaluate('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes with output and expected case insensive', () => {
    const result = evaluate('HeLLo WoRLD ÇŞĞİ-123*%', {
      ...base,
      expected: 'hEllo wOrld çşği-123*%'
    })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes when output is very close to expected', () => {
    const result = evaluate('hello world', { ...base, expected: 'hello worlt' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBeCloseTo(0.909, 3)
  })

  it('passes when output is long and very close to expected', () => {
    const result = evaluate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas blandit semper augue, et placerat.',
      {
        ...base,
        expected:
          'Dorem ipsum lolor sit amet: fonsectetur abipiscing elit. Naecenas blandic semper augue, ed klacerat'
      }
    )
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(0.9)
  })

  it('returns partial score for moderately different output', () => {
    const result = evaluate('kitten', { ...base, expected: 'sitting' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeCloseTo(0.571, 3)
  })

  it('returns low score for completely different output', () => {
    const result = evaluate('abc', { ...base, expected: 'xyz' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns error when expected is empty', () => {
    const result = evaluate('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', () => {
    const result = evaluate('', { ...base, expected: 'hello' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('f1', () => {
  const base: EvaluationConfig = {
    type: 'f1',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes with identical output and expected', () => {
    const result = evaluate('the quick brown fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes regardless of word order', () => {
    const result = evaluate('fox brown quick the', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('fails if half of the words are different but very similar', () => {
    const result = evaluate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas blandit semper augue, et placerat.',
      {
        ...base,
        expected:
          'Forem upsum color dit emet, tonsectetur üdipiscing elit. Maecenas blandit semper augue, et placerat.'
      }
    )
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0.5)
  })

  it('is case insensitive', () => {
    const result = evaluate('THE QUICK BROWN FOX', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('returns partial score when some words overlap', () => {
    const result = evaluate('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeCloseTo(0.857, 3)
  })

  it('returns zero score for completely different words', () => {
    const result = evaluate('cat sat mat', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluate('', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns zero score when expected is empty', () => {
    const result = evaluate('hello world', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluate('', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })
})

describe('json_match', () => {
  const base: EvaluationConfig = {
    type: 'json_match',
    customValidator: { language: 'javascript', code: '' },
    codeExecution: { language: 'javascript', testCases: [] }
  }

  it('passes when all keys match', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const result = evaluate(JSON.stringify({ id: 'u1', name: 'Alice' }), { ...base, expected })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
    expect(result.details).toContain('2/2')
  })

  it('passes when output has extra keys not in expected', () => {
    const expected = JSON.stringify({ id: 'u1' })
    const result = evaluate(JSON.stringify({ id: 'u1', name: 'Alice' }), { ...base, expected })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeCloseTo(0.5)
  })

  it('counts nested object keys individually', () => {
    const json = JSON.stringify({ user: { id: 'u1', name: 'Alice' } })
    const result = evaluate(json, { ...base, expected: json })
    expect(result.correctnessScore).toBe(1)
  })

  it('fails when output is missing expected keys', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice', age: 30 })
    const result = evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBeCloseTo(0.33)
  })

  it('counts array items and their keys', () => {
    const json = JSON.stringify({
      id: 'u1',
      orders: [
        { id: 'o1', amount: 10 },
        { id: 'o2', amount: 20 }
      ]
    })
    const result = evaluate(json, { ...base, expected: json })
    expect(result.details).toContain('6/6')
    expect(result.passed).toBe(true)
  })

  it('matches flat keys regardless of value differences', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const actual = JSON.stringify({ name: 'Bob', id: 'u999' })
    const result = evaluate(actual, { ...base, expected })
    expect(result.passed).toBe(true)
    expect(result.correctnessScore).toBe(1)
  })

  it('passes for empty expected object', () => {
    const result = evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: '{}' })
    expect(result.passed).toBe(false)
    expect(result.correctnessScore).toBe(0)
  })

  it('returns error when expected is empty string', () => {
    const result = evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when expected is not valid JSON', () => {
    const result = evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: 'not json' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is not valid JSON', () => {
    const result = evaluate('not json', { ...base, expected: JSON.stringify({ id: 'u1' }) })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', () => {
    const result = evaluate('', { ...base, expected: JSON.stringify({ id: 'u1' }) })
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
