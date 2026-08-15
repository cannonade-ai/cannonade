import { describe, expect, it } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'
import {
  applyTemplate,
  buildPreviewDocument,
  extractHtml,
  looksLikeHtml,
  shouldOfferHtmlPreview
} from './html-output'

describe('looksLikeHtml', () => {
  it('detects full documents', () => {
    expect(looksLikeHtml('<!doctype html><html><body>hi</body></html>')).toBe(true)
  })

  it('detects fragments with several tags', () => {
    expect(looksLikeHtml('<div class="a"><p>one</p><p>two</p></div>')).toBe(true)
  })

  it('rejects prose that mentions tags', () => {
    expect(
      looksLikeHtml(
        'To center a block you can use a <div> element with flexbox, which is the modern approach most developers reach for these days.'
      )
    ).toBe(false)
  })

  it('rejects json', () => {
    expect(looksLikeHtml('{"a": 1, "b": [2, 3], "c": "x < y"}')).toBe(false)
  })

  it('rejects empty input', () => {
    expect(looksLikeHtml(undefined)).toBe(false)
    expect(looksLikeHtml('')).toBe(false)
  })
})

describe('extractHtml', () => {
  it('unwraps html-labelled fences', () => {
    expect(extractHtml('Sure!\n```html\n<div><p>hi</p></div>\n```\nDone.')).toBe(
      '<div><p>hi</p></div>'
    )
  })

  it('unwraps unlabelled fences holding html', () => {
    expect(extractHtml('```\n<section><h1>Title</h1><p>body</p></section>\n```')).toBe(
      '<section><h1>Title</h1><p>body</p></section>'
    )
  })

  it('ignores fences that are not html', () => {
    const text = '```json\n{"a":1}\n```'
    expect(extractHtml(text)).toBe(text)
  })

  it('returns trimmed input when unfenced', () => {
    expect(extractHtml('  <div>x</div>  ')).toBe('<div>x</div>')
  })
})

describe('applyTemplate', () => {
  it('substitutes the placeholder', () => {
    expect(applyTemplate('<section>{{content}}</section>', '<p>hi</p>')).toBe(
      '<section><p>hi</p></section>'
    )
  })

  it('tolerates whitespace inside the placeholder', () => {
    expect(applyTemplate('<div>{{ content }}</div>', '<p>hi</p>')).toBe('<div><p>hi</p></div>')
  })

  it('substitutes every placeholder', () => {
    expect(applyTemplate('<a>{{content}}</a><b>{{content}}</b>', 'x')).toBe('<a>x</a><b>x</b>')
  })

  it('keeps markup that follows the placeholder', () => {
    const template = '<section>{{content}}</section>\n<link href="fonts.css" rel="stylesheet">'
    expect(applyTemplate(template, '<p>hi</p>')).toBe(
      '<section><p>hi</p></section>\n<link href="fonts.css" rel="stylesheet">'
    )
  })

  it('appends the output when no placeholder is present', () => {
    expect(applyTemplate('<link href="fonts.css" rel="stylesheet">', '<p>hi</p>')).toBe(
      '<link href="fonts.css" rel="stylesheet"><p>hi</p>'
    )
  })

  it('returns the output unchanged for a blank template', () => {
    expect(applyTemplate('', '<p>hi</p>')).toBe('<p>hi</p>')
    expect(applyTemplate(undefined, '<p>hi</p>')).toBe('<p>hi</p>')
    expect(applyTemplate('   ', '<p>hi</p>')).toBe('<p>hi</p>')
  })

  it('does not interpret dollar patterns in the output', () => {
    expect(applyTemplate('<p>{{content}}</p>', 'costs $5 and $& more')).toBe(
      '<p>costs $5 and $& more</p>'
    )
  })

  it('substitutes on repeated calls', () => {
    const template = '<section>{{content}}</section>'
    expect(applyTemplate(template, 'a')).toBe('<section>a</section>')
    expect(applyTemplate(template, 'b')).toBe('<section>b</section>')
  })
})

describe('buildPreviewDocument', () => {
  it('renders output into the template', () => {
    const doc = buildPreviewDocument('<p>hi</p>', '<section class="detail">{{content}}</section>')
    expect(doc).toContain('<section class="detail"><p>hi</p></section>')
  })

  it('keeps a style block from the template', () => {
    const doc = buildPreviewDocument('<p>hi</p>', '{{content}}<style>p { color: red }</style>')
    expect(doc).toContain('<p>hi</p><style>p { color: red }</style>')
  })

  it('wraps a bare fragment in a document shell', () => {
    expect(buildPreviewDocument('<p>hi</p>', '')).toBe(
      '<!doctype html><html><body><p>hi</p></body></html>'
    )
  })

  it('passes full documents through untouched', () => {
    const source = '<!doctype html><html><head><title>t</title></head><body>x</body></html>'
    expect(buildPreviewDocument(source, '')).toBe(source)
  })

  it('does not apply the template to full documents', () => {
    const doc = buildPreviewDocument(
      '<html><body>x</body></html>',
      '<section class="detail">{{content}}</section>'
    )
    expect(doc).not.toContain('<section class="detail">')
  })
})

describe('shouldOfferHtmlPreview', () => {
  const htmlEval: EvaluationConfig[] = [{ type: 'html_validation' }]
  const otherEval: EvaluationConfig[] = [{ type: 'contains' }]

  it('offers when the case has an html_validation eval', () => {
    expect(shouldOfferHtmlPreview('anything at all', htmlEval)).toBe(true)
  })

  it('offers when the output sniffs as html', () => {
    expect(shouldOfferHtmlPreview('<ul><li>a</li><li>b</li></ul>', otherEval)).toBe(true)
  })

  it('does not offer for plain text', () => {
    expect(shouldOfferHtmlPreview('The capital of France is Paris.', otherEval)).toBe(false)
  })

  it('does not offer for empty output', () => {
    expect(shouldOfferHtmlPreview('   ', htmlEval)).toBe(false)
  })
})
