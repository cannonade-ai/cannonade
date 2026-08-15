import type { EvaluationConfig } from '@shared/app/test-suite'

const PAIRED_TAGS =
  'html|body|head|div|p|span|section|article|header|footer|nav|main|aside|form|label|button|a|ul|ol|li|table|thead|tbody|tr|td|th|h1|h2|h3|h4|h5|h6|style|figure|figcaption|blockquote|pre|code|em|strong|b|i|small|title|svg|template|dialog|details|summary'

const DOCUMENT_ROOT = /<!doctype\s+html|<html[\s>]|<body[\s>]/i
const TAG_PAIR = new RegExp(`<(${PAIRED_TAGS})(\\s[^>]*)?>[\\s\\S]*?</\\1\\s*>`, 'i')
const ANY_TAG = new RegExp(`</?(${PAIRED_TAGS}|img|br|hr|input|meta|link)(\\s[^>]*)?/?>`, 'gi')
const FENCE = /```(\w*)[^\S\n]*\n([\s\S]*?)```/g

const MIN_TAG_COUNT = 3
const MIN_MARKUP_RATIO = 0.05

function markupRatio(text: string): number {
  if (!text.length) return 0
  let markupLength = 0
  for (const match of text.matchAll(ANY_TAG)) {
    markupLength += match[0].length
  }
  return markupLength / text.length
}

function tagCount(text: string): number {
  return [...text.matchAll(ANY_TAG)].length
}

export function looksLikeHtml(text: string | undefined): boolean {
  if (!text) return false
  if (DOCUMENT_ROOT.test(text)) return true
  if (!TAG_PAIR.test(text)) return false
  return tagCount(text) >= MIN_TAG_COUNT && markupRatio(text) >= MIN_MARKUP_RATIO
}

export function extractHtml(text: string): string {
  for (const match of text.matchAll(FENCE)) {
    const language = match[1].toLowerCase()
    const body = match[2]
    if (language === 'html' || (language === '' && looksLikeHtml(body))) {
      return body.trim()
    }
  }
  return text.trim()
}

export const CONTENT_PLACEHOLDER = '{{content}}'

function placeholderPattern(): RegExp {
  return /\{\{\s*content\s*\}\}/g
}

export function applyTemplate(template: string | undefined, html: string): string {
  const trimmed = template?.trim()
  if (!trimmed) return html
  const pattern = placeholderPattern()
  if (!pattern.test(trimmed)) return trimmed + html
  return trimmed.replace(placeholderPattern(), () => html)
}

export function buildPreviewDocument(output: string, template: string): string {
  const html = extractHtml(output)
  if (/<html[\s>]/i.test(html)) return html
  return `<!doctype html><html><body>${applyTemplate(template, html)}</body></html>`
}

export function hasHtmlEvaluation(evaluations: EvaluationConfig[]): boolean {
  return evaluations.some((evaluation) => evaluation.type === 'html_validation')
}

export function shouldOfferHtmlPreview(
  output: string | undefined,
  evaluations: EvaluationConfig[]
): boolean {
  if (!output?.trim()) return false
  if (hasHtmlEvaluation(evaluations)) return true
  return looksLikeHtml(extractHtml(output))
}
