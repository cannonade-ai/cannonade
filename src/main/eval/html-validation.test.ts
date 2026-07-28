import { describe, it, expect } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'
import { evaluateHtmlValidation, MAX_HTML_LENGTH } from './html-validation'

const base: EvaluationConfig = { type: 'html_validation' }

describe('html_validation', () => {
  it('passes for a full document', () => {
    const result = evaluateHtmlValidation(
      '<!DOCTYPE html><html><head><title>Hi</title></head><body><p>Hello</p></body></html>',
      base
    )
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes for a bare fragment', () => {
    const result = evaluateHtmlValidation('<div class="card"><span>Hello</span></div>', base)
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('passes for unclosed tags that the parser recovers from', () => {
    const result = evaluateHtmlValidation('<ul><li>one<li>two</ul>', base)
    expect(result.passed).toBe(true)
  })

  it('ignores surrounding whitespace', () => {
    const result = evaluateHtmlValidation('\n\n  <p>Hello</p>  \n', base)
    expect(result.passed).toBe(true)
  })

  it('fails for empty output', () => {
    const result = evaluateHtmlValidation('   ', base)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.details).toBe('Model output was empty')
  })

  it('fails for plain prose the parser silently wraps in html/head/body', () => {
    const result = evaluateHtmlValidation('Sure, here is what you asked for.', base)
    expect(result.passed).toBe(false)
    expect(result.details).toBe('Output has text outside of any HTML element')
  })

  it('fails when markup is preceded by prose', () => {
    const result = evaluateHtmlValidation('Here is the HTML: <div>content</div>', base)
    expect(result.passed).toBe(false)
    expect(result.details).toBe('Output has text outside of any HTML element')
  })

  it('fails for a markdown code fence around the markup', () => {
    const result = evaluateHtmlValidation('```html\n<div>content</div>\n```', base)
    expect(result.passed).toBe(false)
    expect(result.details).toBe('Output has text outside of any HTML element')
  })

  it('fails for an XML document', () => {
    const result = evaluateHtmlValidation(
      '<?xml version="1.0"?><note><body>Hello</body></note>',
      base
    )
    expect(result.passed).toBe(false)
    expect(result.details).toBe('Output is an XML document, not HTML')
  })

  it('fails when the output holds no elements at all', () => {
    const result = evaluateHtmlValidation('<!-- just a comment -->', base)
    expect(result.passed).toBe(false)
    expect(result.details).toBe('Output contains no HTML elements')
  })

  it('errors when the output exceeds the size cap', () => {
    const result = evaluateHtmlValidation(`<div>${'a'.repeat(MAX_HTML_LENGTH)}</div>`, base)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.error).toContain(String(MAX_HTML_LENGTH))
  })

  it('scores unknown tags as invalid', () => {
    const result = evaluateHtmlValidation('<note><to></to><from></from></note>', base)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.details).toContain('0/3 elements valid')
  })

  it('scores custom elements as invalid when no allowlist is set', () => {
    const result = evaluateHtmlValidation('<div><my-widget></my-widget></div>', base)
    expect(result.score).toBe(0.5)
    expect(result.details).toContain('rejected: my-widget')
  })

  it('scores the share of valid elements', () => {
    const result = evaluateHtmlValidation('<div><p>a</p><p>b</p><wat></wat></div>', base)
    expect(result.score).toBe(0.75)
    expect(result.passed).toBe(false)
  })

  it('honors a provided threshold', () => {
    const result = evaluateHtmlValidation('<div><p>a</p><p>b</p><wat></wat></div>', {
      ...base,
      threshold: 0.7
    })
    expect(result.score).toBe(0.75)
    expect(result.passed).toBe(true)
  })
})

describe('html_validation allowlist', () => {
  const allowed: EvaluationConfig = {
    type: 'html_validation',
    htmlValidation: { allowedTags: ['section', 'p'] }
  }

  it('passes when every element is allowed', () => {
    const result = evaluateHtmlValidation('<section><p>Hello</p></section>', allowed)
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('rejects standard tags that are not in the allowlist', () => {
    const result = evaluateHtmlValidation('<section><div>Hello</div></section>', allowed)
    expect(result.score).toBe(0.5)
    expect(result.details).toBe('1/2 elements valid · rejected: div')
  })

  it('accepts custom elements when they are listed', () => {
    const result = evaluateHtmlValidation('<my-widget></my-widget>', {
      type: 'html_validation',
      htmlValidation: { allowedTags: ['my-widget'] }
    })
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('ignores casing and angle brackets in the configured tags', () => {
    const result = evaluateHtmlValidation('<section><p>Hello</p></section>', {
      type: 'html_validation',
      htmlValidation: { allowedTags: ['<SECTION>', ' p '] }
    })
    expect(result.passed).toBe(true)
  })
})

describe('html_validation blocklist', () => {
  const blocked: EvaluationConfig = {
    type: 'html_validation',
    htmlValidation: { blockedTags: ['script'] }
  }

  it('passes when no blocked tag appears', () => {
    const result = evaluateHtmlValidation('<div><p>Hello</p></div>', blocked)
    expect(result.passed).toBe(true)
    expect(result.score).toBe(1)
  })

  it('lowers the score for each blocked element', () => {
    const result = evaluateHtmlValidation('<div><script></script></div>', blocked)
    expect(result.score).toBe(0.5)
    expect(result.details).toBe('1/2 elements valid · rejected: script')
  })

  it('blocks a tag even when the allowlist contains it', () => {
    const result = evaluateHtmlValidation('<div><p>Hello</p></div>', {
      type: 'html_validation',
      htmlValidation: { allowedTags: ['div', 'p'], blockedTags: ['p'] }
    })
    expect(result.score).toBe(0.5)
  })

  it('keeps the configured tags out of the details', () => {
    const result = evaluateHtmlValidation('<div><p>Hello</p></div>', {
      type: 'html_validation',
      htmlValidation: { allowedTags: ['div', 'p'], blockedTags: ['script'] }
    })
    expect(result.details).toBe('2/2 elements valid')
  })

  it('shortens a long list of rejected tags', () => {
    const result = evaluateHtmlValidation('<aa></aa><bb></bb><cc></cc><ee></ee><ff></ff>', base)
    expect(result.details).toBe('0/5 elements valid · rejected: aa, bb, cc +2')
  })
})
