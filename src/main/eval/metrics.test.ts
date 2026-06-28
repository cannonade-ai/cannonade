import { describe, it, expect } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'
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

describe('exact_match', () => {
  const base: EvaluationConfig = {
    type: 'exact_match'
  }

  it('passes when output matches expected exactly', () => {
    const result = evaluateExactMatch('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output matches after trimming whitespace', () => {
    const result = evaluateExactMatch('  hello  ', { ...base, expected: 'hello' })
    expect(result.passed).toBe(true)
  })

  it('fails when output does not match', () => {
    const result = evaluateExactMatch('hello', { ...base, expected: 'world' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('is case sensitive by default', () => {
    const result = evaluateExactMatch('Hello World', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
  })

  it('ignores case when caseSensitive is false', () => {
    const result = evaluateExactMatch('Hello World', {
      ...base,
      expected: 'hello world',
      caseSensitive: false
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })
})

describe('contains', () => {
  const base: EvaluationConfig = {
    type: 'contains'
  }

  it('passes when all terms are found', () => {
    const result = evaluateContains('the cat sat on the mat', { ...base, expected: 'cat, mat' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
    expect(result.details).toBe('2/2 terms found')
  })

  it('returns partial score when only some terms are found', () => {
    const result = evaluateContains('the cat sat on the mat', {
      ...base,
      expected: 'cat, dog, mat'
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(2 / 3)
    expect(result.details).toBe('2/3 terms found')
  })

  it('fails when no terms are found', () => {
    const result = evaluateContains('hello world', { ...base, expected: 'foo, bar' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty', () => {
    const result = evaluateContains('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('matches terms regardless of case by default', () => {
    const result = evaluateContains('The ocean breathes beneath the Silver moon', {
      ...base,
      expected: 'ocean, silver, moon'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
    expect(result.details).toBe('3/3 terms found')
  })

  it('respects case when caseSensitive is true', () => {
    const result = evaluateContains('The ocean beneath the Silver moon', {
      ...base,
      expected: 'ocean, silver, moon',
      caseSensitive: true
    })
    expect(result.passed).toBe(false)
    expect(result.details).toBe('2/3 terms found')
  })
})

describe('regex', () => {
  const base: EvaluationConfig = {
    type: 'regex'
  }

  it('passes when output matches the pattern', () => {
    const result = evaluateRegex('order-1234', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('fails when output does not match the pattern', () => {
    const result = evaluateRegex('order-abc', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('matches partial content within a longer string', () => {
    const result = evaluateRegex('the price is $42.00 today', {
      ...base,
      expected: '\\$\\d+\\.\\d{2}'
    })
    expect(result.passed).toBe(true)
  })

  it('returns error for invalid regex', () => {
    const result = evaluateRegex('anything', { ...base, expected: '[unclosed' })
    expect(result.passed).toBe(false)
    expect(result.error).toMatch(/invalid regex/i)
  })

  it('returns error when pattern is empty', () => {
    const result = evaluateRegex('anything', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('matches case-insensitively by default', () => {
    const result = evaluateRegex('ORDER-1234', { ...base, expected: '^order-\\d+$' })
    expect(result.passed).toBe(true)
  })

  it('respects case when caseSensitive is true', () => {
    const result = evaluateRegex('ORDER-1234', {
      ...base,
      expected: '^order-\\d+$',
      caseSensitive: true
    })
    expect(result.passed).toBe(false)
  })
})

describe('rouge', () => {
  const base: EvaluationConfig = {
    type: 'rouge'
  }

  it('passes with identical output and expected', () => {
    const result = evaluateRouge('the quick brown fox', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output is a case-insensitive match', () => {
    const result = evaluateRouge('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('penalizes case differences when caseSensitive is true', () => {
    const result = evaluateRouge('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox',
      caseSensitive: true
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns partial score for partially overlapping output', () => {
    const result = evaluateRouge('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(1)
  })

  it('returns partial score for partially overlapping output 2', () => {
    const result = evaluateRouge(
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

  it('returns zero score for completely different output', () => {
    const result = evaluateRouge('completely different text', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when expected is empty', () => {
    const result = evaluateRouge('some output', { ...base, expected: '' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluateRouge('', { ...base, expected: 'some expected text' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })
})

describe('levenshtein', () => {
  const base: EvaluationConfig = {
    type: 'levenshtein'
  }

  it('passes with identical output and expected', () => {
    const result = evaluateLevenshtein('hello world', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes with output and expected case insensive', () => {
    const result = evaluateLevenshtein('HeLLo WoRLD-123*%', {
      ...base,
      expected: 'hEllo wOrld-123*%'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes when output is very close to expected', () => {
    const result = evaluateLevenshtein('hello world', { ...base, expected: 'hello worlt' })
    expect(result.passed).toBe(true)
    expect(result.score).toBeCloseTo(0.909, 3)
  })

  it('penalizes case differences when caseSensitive is true', () => {
    const result = evaluateLevenshtein('HELLOWORLD', {
      ...base,
      expected: 'helloworld',
      caseSensitive: true
    })
    console.log(result)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('passes when output is long and very close to expected', () => {
    const result = evaluateLevenshtein(
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

  it('returns partial score for moderately different output', () => {
    const result = evaluateLevenshtein('kitten', { ...base, expected: 'sitting' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.571, 3)
  })

  it('returns low score for completely different output', () => {
    const result = evaluateLevenshtein('abc', { ...base, expected: 'xyz' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty', () => {
    const result = evaluateLevenshtein('hello', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', () => {
    const result = evaluateLevenshtein('', { ...base, expected: 'hello' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('f1', () => {
  const base: EvaluationConfig = {
    type: 'f1'
  }

  it('passes with identical output and expected', () => {
    const result = evaluateF1('the quick brown fox', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes regardless of word order', () => {
    const result = evaluateF1('fox brown quick the', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('fails if half of the words are different but very similar', () => {
    const result = evaluateF1(
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

  it('is case insensitive', () => {
    const result = evaluateF1('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('penalizes case differences when caseSensitive is true', () => {
    const result = evaluateF1('THE QUICK BROWN FOX', {
      ...base,
      expected: 'the quick brown fox',
      caseSensitive: true
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns partial score when some words overlap', () => {
    const result = evaluateF1('the quick fox', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.857, 3)
  })

  it('returns zero score for completely different words', () => {
    const result = evaluateF1('cat sat mat', { ...base, expected: 'the quick brown fox' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluateF1('', { ...base, expected: 'hello world' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when expected is empty', () => {
    const result = evaluateF1('hello world', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })
})

describe('json_match', () => {
  const base: EvaluationConfig = {
    type: 'json_match'
  }

  it('passes when all keys match', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1', name: 'Alice' }), {
      ...base,
      expected
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
    expect(result.details).toContain('2/2')
  })

  it('passes when output has extra keys not in expected', () => {
    const expected = JSON.stringify({ id: 'u1' })
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1', name: 'Alice' }), {
      ...base,
      expected
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.5)
  })

  it('counts nested object keys individually', () => {
    const json = JSON.stringify({ user: { id: 'u1', name: 'Alice' } })
    const result = evaluateJsonMatch(json, { ...base, expected: json })
    expect(result.score).toBe(1)
  })

  it('fails when output is missing expected keys', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice', age: 30 })
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1' }), { ...base, expected })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.33)
  })

  it('counts array items and their keys', () => {
    const json = JSON.stringify({
      id: 'u1',
      orders: [
        { id: 'o1', amount: 10 },
        { id: 'o2', amount: 20 }
      ]
    })
    const result = evaluateJsonMatch(json, { ...base, expected: json })
    expect(result.details).toContain('6/6')
    expect(result.passed).toBe(true)
  })

  it('matches flat keys regardless of value differences', () => {
    const expected = JSON.stringify({ id: 'u1', name: 'Alice' })
    const actual = JSON.stringify({ name: 'Bob', id: 'u999' })
    const result = evaluateJsonMatch(actual, { ...base, expected })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes for empty expected object', () => {
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1' }), { ...base, expected: '{}' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns error when expected is empty string', () => {
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1' }), { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when expected is not valid JSON', () => {
    const result = evaluateJsonMatch(JSON.stringify({ id: 'u1' }), {
      ...base,
      expected: 'not json'
    })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is not valid JSON', () => {
    const result = evaluateJsonMatch('not json', {
      ...base,
      expected: JSON.stringify({ id: 'u1' })
    })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', () => {
    const result = evaluateJsonMatch('', { ...base, expected: JSON.stringify({ id: 'u1' }) })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('bleu', () => {
  const base: EvaluationConfig = {
    type: 'bleu'
  }

  it('passes with identical output and expected', () => {
    const result = evaluateBleu('the quick brown fox jumps', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('returns partial score for mostly overlapping output', () => {
    const result = evaluateBleu('the quick brown dog jumps', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.632, 3)
  })

  it('ignores case by default', () => {
    const result = evaluateBleu('THE QUICK BROWN FOX JUMPS', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('penalizes case differences when caseSensitive is true', () => {
    const result = evaluateBleu('THE QUICK BROWN FOX JUMPS', {
      ...base,
      expected: 'the quick brown fox jumps',
      caseSensitive: true
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns low score for completely different output', () => {
    const result = evaluateBleu('completely unrelated text here', {
      ...base,
      expected: 'the quick brown fox jumps'
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns zero score when expected is empty', () => {
    const result = evaluateBleu('some output text', { ...base, expected: '' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns zero score when output is empty', () => {
    const result = evaluateBleu('', { ...base, expected: 'the quick brown fox jumps' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })
})
