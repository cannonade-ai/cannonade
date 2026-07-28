import { parse, type DefaultTreeAdapterTypes } from 'parse5'
import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import { PASS_THRESHOLD } from './metrics'

export const MAX_HTML_LENGTH = 200_000

const KNOWN_HTML_TAGS = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'math',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'search',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr'
])

const MAX_LISTED_TAGS = 3

interface HtmlScan {
  tagCounts: Map<string, number>
  hasStrayText: boolean
}

export function evaluateHtmlValidation(
  output: string,
  evaluation: EvaluationConfig
): EvaluationResult {
  const html = output.trim()

  if (html.length === 0) {
    return failed('Model output was empty')
  }
  if (html.length > MAX_HTML_LENGTH) {
    return {
      score: 0,
      passed: false,
      error: `Model output exceeds the ${MAX_HTML_LENGTH} character limit for HTML validation`
    }
  }
  if (/^<\?xml[\s?]/i.test(html)) {
    return failed('Output is an XML document, not HTML')
  }

  const document = parse(html, { sourceCodeLocationInfo: true })
  const scan: HtmlScan = { tagCounts: new Map(), hasStrayText: false }
  scanNodes(document.childNodes, false, scan)

  if (scan.hasStrayText) {
    return failed('Output has text outside of any HTML element')
  }
  if (scan.tagCounts.size === 0) {
    return failed('Output contains no HTML elements')
  }

  const allowedTags = normalizeTags(evaluation.htmlValidation?.allowedTags)
  const blockedTags = normalizeTags(evaluation.htmlValidation?.blockedTags)

  let totalElements = 0
  let validElements = 0
  const rejectedTags: string[] = []

  for (const [tagName, count] of scan.tagCounts) {
    totalElements += count
    if (isAcceptedTag(tagName, allowedTags, blockedTags)) {
      validElements += count
    } else {
      rejectedTags.push(tagName)
    }
  }

  const score = validElements / totalElements
  return {
    score,
    passed: score >= (evaluation.threshold ?? PASS_THRESHOLD),
    details: describeResult(validElements, totalElements, rejectedTags)
  }
}

function scanNodes(
  nodes: DefaultTreeAdapterTypes.ChildNode[],
  parentAuthored: boolean,
  scan: HtmlScan
): void {
  for (const node of nodes) {
    if (!('tagName' in node)) {
      if (node.nodeName === '#text' && !parentAuthored && node.value.trim().length > 0) {
        scan.hasStrayText = true
      }
      continue
    }

    const authored = node.sourceCodeLocation != null
    if (authored) {
      const tagName = node.tagName.toLowerCase()
      scan.tagCounts.set(tagName, (scan.tagCounts.get(tagName) ?? 0) + 1)
    }
    scanNodes(node.childNodes, authored, scan)
  }
}

function isAcceptedTag(tagName: string, allowedTags: string[], blockedTags: string[]): boolean {
  if (blockedTags.includes(tagName)) {
    return false
  }
  if (allowedTags.length > 0) {
    return allowedTags.includes(tagName)
  }
  return KNOWN_HTML_TAGS.has(tagName)
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return []
  }
  return tags
    .map((tag) =>
      tag
        .trim()
        .replace(/^<|\/?>$/g, '')
        .toLowerCase()
    )
    .filter(Boolean)
}

function describeResult(
  validElements: number,
  totalElements: number,
  rejectedTags: string[]
): string {
  const summary = `${validElements}/${totalElements} elements valid`
  if (rejectedTags.length === 0) {
    return summary
  }
  return `${summary} · rejected: ${listTags(rejectedTags)}`
}

function listTags(tags: string[]): string {
  const shown = tags.slice(0, MAX_LISTED_TAGS).join(', ')
  const rest = tags.length - MAX_LISTED_TAGS
  return rest > 0 ? `${shown} +${rest}` : shown
}

function failed(details: string): EvaluationResult {
  return { score: 0, passed: false, details }
}
