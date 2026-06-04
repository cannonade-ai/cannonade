import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import { l as rougeL } from 'js-rouge'
import { distance as levenshteinDistance } from 'fastest-levenshtein'
import { bleu } from 'bleu-score'

export function evaluateBleu(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (!expected) {
    return { score: 0, passed: false, error: 'No expected value provided' }
  }
  if (output.length === 0) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }
  const score = bleu(expected, output, 2)
  return { score, passed: score >= (evaluation.threshold ?? PASS_THRESHOLD) }
}

export function evaluateF1(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''

  const predSet = new Set(output.toLowerCase().split(' '))
  const refSet = new Set(expected.toLowerCase().split(' '))
  const common = [...predSet].filter((t) => refSet.has(t))

  const precision = common.length / predSet.size
  const recall = common.length / refSet.size

  if (precision + recall === 0) {
    return { score: 0, passed: false }
  }
  const score = (2 * precision * recall) / (precision + recall)
  return { score, passed: score >= (evaluation.threshold ?? PASS_THRESHOLD) }
}

export function evaluateExactMatch(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const matched = output.trim() === expected.trim()
  const score = matched ? 1 : 0
  return { score, passed: matched }
}

export function evaluateRegex(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const pattern = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (!pattern) {
    return { score: 0, passed: false, error: 'No regex pattern provided' }
  }
  let regex: RegExp
  try {
    regex = new RegExp(pattern)
  } catch {
    return { score: 0, passed: false, error: `Invalid regex pattern: ${pattern}` }
  }
  const matched = regex.test(output)
  const score = matched ? 1 : 0
  return { score, passed: matched }
}

export function evaluateContains(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const raw = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const terms = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (!terms.length) {
    return { score: 0, passed: false, error: 'No search terms provided' }
  }
  const matched = terms.filter((t) => output.includes(t))
  const score = matched.length / terms.length
  return {
    score,
    passed: score >= (evaluation.threshold ?? PASS_THRESHOLD),
    details: `${matched.length}/${terms.length} terms found`
  }
}

export function evaluateNotContains(
  output: string,
  evaluation: EvaluationConfig
): EvaluationResult {
  const raw = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const terms = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (!terms.length) {
    return { score: 0, passed: false, error: 'No search terms provided' }
  }
  const matched = terms.filter((t) => output.includes(t))
  const score = 1 - matched.length / terms.length
  return {
    score,
    passed: score >= (evaluation.threshold ?? PASS_THRESHOLD),
    details: `${matched.length}/${terms.length} forbidden terms found`
  }
}

export function evaluateRouge(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (expected.length === 0) {
    return { score: 0, passed: false, error: 'No expected value provided' }
  }
  if (output.length === 0) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }
  const score = rougeL(output, expected, { caseSensitive: false })
  return { score, passed: score >= (evaluation.threshold ?? PASS_THRESHOLD) }
}

export function evaluateLevenshtein(
  output: string,
  evaluation: EvaluationConfig
): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (expected.length === 0) {
    return { score: 0, passed: false, error: 'No expected value provided' }
  }
  if (output.length === 0) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }
  const distance = levenshteinDistance(output.toLocaleLowerCase(), expected.toLocaleLowerCase())
  const score = 1 - distance / Math.max(output.length, expected.length)
  return { score, passed: score >= (evaluation.threshold ?? PASS_THRESHOLD) }
}

export function evaluateJsonMatch(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expectedRaw = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (expectedRaw.length === 0) {
    return { score: 0, passed: false, error: 'No expected JSON provided' }
  }
  if (output.length === 0) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }

  let actualJson: object
  let expectedJson: object

  try {
    expectedJson = JSON.parse(expectedRaw)
  } catch {
    return { score: 0, passed: false, error: 'Expected value is not valid JSON' }
  }

  try {
    actualJson = JSON.parse(output)
  } catch {
    return { score: 0, passed: false, error: 'Model output is not valid JSON' }
  }

  const expectedPaths = collectJsonPaths(expectedJson)
  const actualPaths = collectJsonPaths(actualJson)
  const totalFields = Math.max(expectedPaths.size, actualPaths.size)

  if (totalFields === 0) {
    return { score: 1, passed: true }
  }

  let matchedFields = 0
  for (const path of expectedPaths) {
    if (actualPaths.has(path)) matchedFields++
  }

  const score = matchedFields / totalFields
  return {
    score,
    passed: score >= (evaluation.threshold ?? PASS_THRESHOLD),
    details: `Matched ${matchedFields}/${totalFields} keys`
  }
}

function collectJsonPaths(obj: unknown, prefix = '', paths = new Set<string>()): Set<string> {
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => collectJsonPaths(item, `${prefix}[${index}]`, paths))
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${key}` : key
      paths.add(path)
      collectJsonPaths(obj[key as keyof typeof obj], path, paths)
    }
  }
  return paths
}

const PASS_THRESHOLD = 0.9
