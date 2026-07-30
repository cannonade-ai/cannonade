import { describe, it, expect } from 'vitest'
import {
  extractJsonObjects,
  parseJudgeSteps,
  parseJudgeVerdict,
  stripReasoningAndFences
} from './judge-json'

describe('stripReasoningAndFences', () => {
  it('removes code fences', () => {
    expect(stripReasoningAndFences('```json\n{"pass": true}\n```')).toBe('{"pass": true}')
  })

  it('removes closed reasoning blocks', () => {
    expect(stripReasoningAndFences('<think>hmm {"pass": false}</think>{"pass": true}')).toBe(
      '{"pass": true}'
    )
  })

  it('removes an unterminated reasoning block', () => {
    expect(stripReasoningAndFences('answer<think>still thinking')).toBe('answer')
  })
})

describe('extractJsonObjects', () => {
  it('extracts a nested object as one candidate', () => {
    expect(extractJsonObjects('prefix {"a": {"b": 1}} suffix')).toEqual(['{"a": {"b": 1}}'])
  })

  it('ignores braces inside strings', () => {
    expect(extractJsonObjects('{"reason": "uses { and } chars"}')).toEqual([
      '{"reason": "uses { and } chars"}'
    ])
  })

  it('ignores escaped quotes', () => {
    expect(extractJsonObjects('{"reason": "say \\"hi\\""}')).toEqual(['{"reason": "say \\"hi\\""}'])
  })

  it('returns every top level object', () => {
    expect(extractJsonObjects('{"a": 1} and {"b": 2}')).toEqual(['{"a": 1}', '{"b": 2}'])
  })

  it('skips unbalanced closing braces', () => {
    expect(extractJsonObjects('} {"a": 1}')).toEqual(['{"a": 1}'])
  })
})

describe('parseJudgeVerdict', () => {
  it('parses a clean response', () => {
    expect(parseJudgeVerdict('{"reason": "greets", "pass": true, "score": 1.0}')).toEqual({
      pass: true,
      score: 1,
      reason: 'greets'
    })
  })

  it('parses a fenced response with surrounding prose', () => {
    const text = 'Here is my grade:\n```json\n{"reason":"rude","pass":false,"score":0}\n```\nDone.'
    expect(parseJudgeVerdict(text)).toEqual({ pass: false, score: 0, reason: 'rude' })
  })

  it('coerces a string pass value', () => {
    expect(parseJudgeVerdict('{"pass": "true", "score": "0.75"}')).toEqual({
      pass: true,
      score: 0.75,
      reason: undefined
    })
  })

  it('derives score from pass when score is missing', () => {
    expect(parseJudgeVerdict('{"pass": true}')?.score).toBe(1)
    expect(parseJudgeVerdict('{"pass": false}')?.score).toBe(0)
  })

  it('defaults pass to true when the judge omits it', () => {
    expect(parseJudgeVerdict('{"score": 0.9}')?.pass).toBe(true)
    expect(parseJudgeVerdict('{"score": 0.2}')?.pass).toBe(true)
    expect(parseJudgeVerdict('{"score": 0}')?.pass).toBe(true)
  })

  it('clamps out of range scores', () => {
    expect(parseJudgeVerdict('{"pass": true, "score": 5}')?.score).toBe(1)
    expect(parseJudgeVerdict('{"pass": false, "score": -3}')?.score).toBe(0)
  })

  it('accepts alternative field names', () => {
    expect(parseJudgeVerdict('{"passed": true, "explanation": "fine"}')).toEqual({
      pass: true,
      score: 1,
      reason: 'fine'
    })
  })

  it('skips objects that carry no verdict', () => {
    expect(parseJudgeVerdict('{"note": "thinking"} {"pass": true, "score": 1}')).toEqual({
      pass: true,
      score: 1,
      reason: undefined
    })
  })

  it('returns null when there is no JSON at all', () => {
    expect(parseJudgeVerdict('The output looks good to me!')).toBeNull()
  })

  it('returns null when the JSON is malformed', () => {
    expect(parseJudgeVerdict('{"pass": tru')).toBeNull()
  })

  it('returns null when no verdict field is present', () => {
    expect(parseJudgeVerdict('{"reason": "no verdict here"}')).toBeNull()
  })
})

describe('parseJudgeSteps', () => {
  it('reads a minified steps object', () => {
    expect(parseJudgeSteps('{"steps":["First","Second"]}')).toEqual(['First', 'Second'])
  })

  it('reads steps out of code fences and trims them', () => {
    expect(parseJudgeSteps('```json\n{"steps":["  First  "]}\n```')).toEqual(['First'])
  })

  it('drops non-string and blank entries', () => {
    expect(parseJudgeSteps('{"steps":["First",7,null,"  ","Second"]}')).toEqual(['First', 'Second'])
  })

  it('returns null when every entry is dropped', () => {
    expect(parseJudgeSteps('{"steps":[1,2,""]}')).toBeNull()
  })

  it('returns null for an empty steps list', () => {
    expect(parseJudgeSteps('{"steps":[]}')).toBeNull()
  })

  it('returns null when steps is not an array', () => {
    expect(parseJudgeSteps('{"steps":"First then second"}')).toBeNull()
  })

  it('returns null when the JSON is malformed', () => {
    expect(parseJudgeSteps('{"steps": ["unterminated')).toBeNull()
  })

  it('returns null when there is no JSON at all', () => {
    expect(parseJudgeSteps('Here are the steps: check the tone.')).toBeNull()
  })

  it('skips objects that carry no steps', () => {
    expect(parseJudgeSteps('{"note":"thinking"} {"steps":["First"]}')).toEqual(['First'])
  })
})
