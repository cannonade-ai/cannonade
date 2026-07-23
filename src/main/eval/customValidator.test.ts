import { describe, it, expect } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'
import { runCustomValidator } from './customValidator'

const base: EvaluationConfig = {
  type: 'custom',
  customValidator: {
    language: 'javascript',
    code: '(output) => ({ score: 1 })'
  }
}

describe('runCustomValidator', () => {
  it('returns error when customValidator is missing', async () => {
    const result = await runCustomValidator('output', { type: 'custom' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when code is empty string', async () => {
    const result = await runCustomValidator('output', {
      type: 'custom',
      customValidator: { language: 'javascript', code: '' }
    })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('passes when validator returns score 1', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => ({ score: 1 })' }
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('fails when validator returns score 0', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => ({ score: 0 })' }
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('passes a partial score through', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => ({ score: 0.5 })' }
    })
    expect(result.score).toBe(0.5)
    expect(result.passed).toBe(false)
  })

  it('clamps score above 1 to 1', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => ({ score: 99 })' }
    })
    expect(result.score).toBe(1)
  })

  it('clamps score below 0 to 0', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => ({ score: -5 })' }
    })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('forwards details from the validator result', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: {
        language: 'javascript',
        code: '(output) => ({ score: 1, details: "all good" })'
      }
    })
    expect(result.details).toBe('all good')
  })

  it('passes the output string to the validator function', async () => {
    const result = await runCustomValidator('expected-value', {
      ...base,
      customValidator: {
        language: 'javascript',
        code: '(output) => ({ score: output === "expected-value" ? 1 : 0 })'
      }
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('respects a custom threshold', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      threshold: 0.5,
      customValidator: { language: 'javascript', code: '(output) => ({ score: 0.7 })' }
    })
    expect(result.passed).toBe(true)
  })

  it('returns error when validator throws', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: {
        language: 'javascript',
        code: '(output) => { throw new Error("boom") }'
      }
    })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.error).toMatch(/custom validator error/i)
  })

  it('returns error for syntactically invalid code', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '((( not valid' }
    })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when validator does not return an object', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: { language: 'javascript', code: '(output) => null' }
    })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('blocks access to node and process globals', async () => {
    const result = await runCustomValidator('hello', {
      ...base,
      customValidator: {
        language: 'javascript',
        code: '(output) => ({ score: typeof process === "undefined" && typeof require === "undefined" && typeof globalThis.fetch === "undefined" ? 1 : 0 })'
      }
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('terminates an infinite loop via the timeout', async () => {
    const result = await runCustomValidator(
      'hello',
      {
        ...base,
        customValidator: {
          language: 'javascript',
          code: '(output) => { while (true) {} }'
        }
      },
      50
    )

    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.error).contain('interrupted')
  })
})

describe('word-count custom validator', () => {
  const wordCountValidator = `(function(output) {
    var words = output.trim().split(/\\s+/).filter(function(w) { return w.length > 0; });
    var count = words.length;
    if (count === 0) return { score: 0, details: '0 words' };
    var target = 50;
    var diff = Math.abs(count - target);
    var score = Math.max(0, 1 - diff / target);
    return { score: score, details: count + ' words (target: ' + target + ')' };
  })`

  const config: EvaluationConfig = {
    type: 'custom',
    threshold: 0.8,
    customValidator: { language: 'javascript', code: wordCountValidator }
  }

  it('passes when output is exactly 50 words', async () => {
    const output = Array(50).fill('word').join(' ')
    const result = await runCustomValidator(output, config)
    expect(result.score).toBe(1)
    expect(result.passed).toBe(true)
    expect(result.details).toBe('50 words (target: 50)')
  })

  it('passes when output is close enough to 50 words', async () => {
    const output = Array(45).fill('word').join(' ')
    const result = await runCustomValidator(output, config)
    expect(result.score).toBe(0.9)
    expect(result.passed).toBe(true)
  })

  it('fails when output is too short', async () => {
    const output = Array(10).fill('word').join(' ')
    const result = await runCustomValidator(output, config)
    expect(result.passed).toBe(false)
    expect(result.score).toBeCloseTo(0.2, 8)
  })

  it('fails when output is empty', async () => {
    const result = await runCustomValidator('', config)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
    expect(result.details).toBe('0 words')
  })

  it('fails when output far exceeds 50 words', async () => {
    const output = Array(150).fill('word').join(' ')
    const result = await runCustomValidator(output, config)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })
})
