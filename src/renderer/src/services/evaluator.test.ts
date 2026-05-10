import { describe, it, expect } from 'vitest'
import { evaluate } from './evaluator'
import type { EvaluationConfig } from '@shared/app/test-suite'

describe('exact_match', () => {
  const base: EvaluationConfig = {
    type: 'exact_match'
  }

  it('passes when output matches expected exactly', async () => {
    const result = await evaluate('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output matches after trimming whitespace', async () => {
    const result = await evaluate('  hello  ', { ...base, expected: 'hello' })
    expect(result.passed).toBe(true)
  })

  it('fails when output does not match', async () => {
    const result = await evaluate('hello', { ...base, expected: 'world' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })
})

describe('contains', () => {
  const base: EvaluationConfig = {
    type: 'contains'
  }

  it('passes when all terms are found', async () => {
    const result = await evaluate('the cat sat on the mat', { ...base, expected: 'cat, mat' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
    expect(result.details).toBe('2/2 terms found')
  })

  it('returns partial score when only some terms are found', async () => {
    const result = await evaluate('the cat sat on the mat', { ...base, expected: 'cat, dog, mat' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(2 / 3)
    expect(result.details).toBe('2/3 terms found')
  })

  it('fails when no terms are found', async () => {
    const result = await evaluate('hello world', { ...base, expected: 'foo, bar' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty', async () => {
    const result = await evaluate('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('regex', () => {
  const base: EvaluationConfig = {
    type: 'regex'
  }

  it('passes when output matches the pattern', async () => {
    const result = await evaluate('order-1234', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('fails when output does not match the pattern', async () => {
    const result = await evaluate('order-abc', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('matches partial content within a longer string', async () => {
    const result = await evaluate('the price is $42.00 today', {
      ...base,
      expected: '\\$\\d+\\.\\d{2}'
    })
    expect(result.passed).toBe(true)
  })

  it('returns error for invalid regex', async () => {
    const result = await evaluate('anything', { ...base, expected: '[unclosed' })
    expect(result.passed).toBe(false)
    expect(result.error).toMatch(/invalid regex/i)
  })

  it('returns error when pattern is empty', async () => {
    const result = await evaluate('anything', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('rouge', () => {
  const base: EvaluationConfig = {
    type: 'rouge'
  }

  it('passes with identical output and expected', async () => {
    const result = await evaluate('the quick brown fox', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output is a case-insensitive match', async () => {
    const result = await evaluate('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('returns partial score for partially overlapping output', async () => {
    const result = await evaluate('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(1)
  })

  it('returns partial score for partially overlapping output 2', async () => {
    const result = await evaluate(
      `Two things are infinite, universe and human stupidity. I am not sure about the universe.`,
      {
        ...base,
        expected: `Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.`
      }
    )
    expect(result.passed).toBe(false)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(1)
  })

  it('returns zero score for completely different output', async () => {
    const result = await evaluate('completely different text', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when expected is empty', async () => {
    const result = await evaluate('some output', { ...base, expected: '' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: 'some expected text' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })
})

describe('levenshtein', () => {
  const base: EvaluationConfig = {
    type: 'levenshtein'
  }

  it('passes with identical output and expected', async () => {
    const result = await evaluate('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes with output and expected case insensive', async () => {
    const result = await evaluate('HeLLo WoRLD ÇŞĞİ-123*%', {
      ...base,
      expected: 'hEllo wOrld çşği-123*%'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output is very close to expected', async () => {
    const result = await evaluate('hello world', { ...base, expected: 'hello worlt' })
    expect(result.passed).toBe(true)
    expect(result.score).toBeCloseTo(0.909, 3)
  })

  it('passes when output is long and very close to expected', async () => {
    const result = await evaluate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas blandit semper augue, et placerat.',
      {
        ...base,
        expected:
          'Dorem ipsum lolor sit amet: fonsectetur abipiscing elit. Naecenas blandic semper augue, ed klacerat'
      }
    )
    expect(result.passed).toBe(true)
    expect(result.score).toBe(0.9)
  })

  it('returns partial score for moderately different output', async () => {
    const result = await evaluate('kitten', { ...base, expected: 'sitting' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.571, 3)
  })

  it('returns low score for completely different output', async () => {
    const result = await evaluate('abc', { ...base, expected: 'xyz' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty', async () => {
    const result = await evaluate('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: 'hello' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('f1', () => {
  const base: EvaluationConfig = {
    type: 'f1'
  }

  it('passes with identical output and expected', async () => {
    const result = await evaluate('the quick brown fox', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes regardless of word order', async () => {
    const result = await evaluate('fox brown quick the', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('fails if half of the words are different but very similar', async () => {
    const result = await evaluate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas blandit semper augue, et placerat.',
      {
        ...base,
        expected:
          'Forem upsum color dit emet, tonsectetur üdipiscing elit. Maecenas blandit semper augue, et placerat.'
      }
    )
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0.5)
  })

  it('is case insensitive', async () => {
    const result = await evaluate('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('returns partial score when some words overlap', async () => {
    const result = await evaluate('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.857, 3)
  })

  it('returns zero score for completely different words', async () => {
    const result = await evaluate('cat sat mat', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when expected is empty', async () => {
    const result = await evaluate('hello world', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })
})

describe('json_match', () => {
  const base: EvaluationConfig = {
    type: 'json_match'
  }

  it('passes when all keys match', async () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const result = await evaluate(JSON.stringify({ id: 'u1', name: 'Alice' }), {
      ...base,
      expected
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
    expect(result.details).toContain('2/2')
  })

  it('passes when output has extra keys not in expected', async () => {
    const expected = JSON.stringify({ id: 'u1' })
    const result = await evaluate(JSON.stringify({ id: 'u1', name: 'Alice' }), {
      ...base,
      expected
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.5)
  })

  it('counts nested object keys individually', async () => {
    const json = JSON.stringify({ user: { id: 'u1', name: 'Alice' } })
    const result = await evaluate(json, { ...base, expected: json })
    expect(result.score).toBe(1)
  })

  it('fails when output is missing expected keys', async () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice', age: 30 })
    const result = await evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.33)
  })

  it('counts array items and their keys', async () => {
    const json = JSON.stringify({
      id: 'u1',
      orders: [
        { id: 'o1', amount: 10 },
        { id: 'o2', amount: 20 }
      ]
    })
    const result = await evaluate(json, { ...base, expected: json })
    expect(result.details).toContain('6/6')
    expect(result.passed).toBe(true)
  })

  it('matches flat keys regardless of value differences', async () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const actual = JSON.stringify({ name: 'Bob', id: 'u999' })
    const result = await evaluate(actual, { ...base, expected })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes for empty expected object', async () => {
    const result = await evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: '{}' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty string', async () => {
    const result = await evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when expected is not valid JSON', async () => {
    const result = await evaluate(JSON.stringify({ id: 'u1' }), { ...base, expected: 'not json' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is not valid JSON', async () => {
    const result = await evaluate('not json', { ...base, expected: JSON.stringify({ id: 'u1' }) })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: JSON.stringify({ id: 'u1' }) })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('bleu', () => {
  const base: EvaluationConfig = {
    type: 'bleu'
  }

  it('passes with identical output and expected', async () => {
    const result = await evaluate('the quick brown fox jumps', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('returns partial score for mostly overlapping output', async () => {
    const result = await evaluate('the quick brown dog jumps', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.632, 3)
  })

  it('returns low score for completely different output', async () => {
    const result = await evaluate('completely unrelated text here', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when expected is empty', async () => {
    const result = await evaluate('some output text', { ...base, expected: '' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when output is empty', async () => {
    const result = await evaluate('', { ...base, expected: 'the quick brown fox jumps' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })
})

describe('unknown type', () => {
  it('returns error for unimplemented type', async () => {
    const config = {
      type: 'unknown_type'
    } as unknown as EvaluationConfig
    const result = await evaluate('output', config)
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
