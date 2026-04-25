import type { EvaluationConfig } from '@shared/app/test-suite'
import { l as rougeL } from 'js-rouge'
import { distance as levenshteinDistance } from 'fastest-levenshtein'

export interface EvaluationResult {
  correctnessScore: number
  passed: boolean
  details?: string
  error?: string
}

const PASS_THRESHOLD = 0.9 // todo: make this parametric

export function evaluate(output: string, evaluation: EvaluationConfig): EvaluationResult {
  switch (evaluation.type) {
    case 'exact_match':
      return evaluateExactMatch(output, evaluation)
    case 'contains':
      return evaluateContains(output, evaluation)
    case 'regex':
      return evaluateRegex(output, evaluation)
    case 'rouge':
      return evaluateRouge(output, evaluation)
    case 'levenshtein':
      return evaluateLevenshtein(output, evaluation)
    case 'f1':
      return evaluateF1(output, evaluation)
    default:
      return {
        correctnessScore: 0,
        passed: false,
        error: `Evaluation type '${evaluation.type}' is not implemented yet`
      }
  }
}

function evaluateF1(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''

  const predSet = new Set(output.toLowerCase().split(' '))
  const refSet = new Set(expected.toLowerCase().split(' '))
  const common = [...predSet].filter((t) => refSet.has(t))

  const precision = common.length / predSet.size
  const recall = common.length / refSet.size

  if (precision + recall === 0) {
    return { correctnessScore: 0, passed: false }
  }
  const correctnessScore = (2 * precision * recall) / (precision + recall)
  return { correctnessScore, passed: correctnessScore >= PASS_THRESHOLD }
}

function evaluateExactMatch(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const correctnessScore = output.trim() === expected.trim() ? 1 : 0
  return { correctnessScore, passed: correctnessScore >= PASS_THRESHOLD }
}

function evaluateRegex(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const pattern = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (!pattern) {
    return { correctnessScore: 0, passed: false, error: 'No regex pattern provided' }
  }
  let regex: RegExp
  try {
    regex = new RegExp(pattern)
  } catch {
    return { correctnessScore: 0, passed: false, error: `Invalid regex pattern: ${pattern}` }
  }
  const matched = regex.test(output)
  const correctnessScore = matched ? 1 : 0
  return { correctnessScore, passed: matched }
}

function evaluateContains(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const raw = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const terms = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (!terms.length) {
    return { correctnessScore: 0, passed: false, error: 'No search terms provided' }
  }
  const matched = terms.filter((t) => output.includes(t))
  const correctnessScore = matched.length / terms.length
  return {
    correctnessScore,
    passed: correctnessScore >= PASS_THRESHOLD,
    details: `${matched.length}/${terms.length} terms found`
  }
}

function evaluateRouge(output: string, evaluation: EvaluationConfig): EvaluationResult {
  // todo: add case insensivity as param
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (expected.length === 0) {
    return { correctnessScore: 0, passed: false, error: 'No expected value provided' }
  }
  if (output.length === 0) {
    return { correctnessScore: 0, passed: false, error: 'Model output was empty' }
  }
  const correctnessScore = rougeL(output, expected, { caseSensitive: false })
  return { correctnessScore, passed: correctnessScore >= PASS_THRESHOLD }
}

function evaluateLevenshtein(output: string, evaluation: EvaluationConfig): EvaluationResult {
  // todo: add case insensivity as param
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (expected.length === 0) {
    return { correctnessScore: 0, passed: false, error: 'No expected value provided' }
  }
  if (output.length === 0) {
    return { correctnessScore: 0, passed: false, error: 'Model output was empty' }
  }
  const distance = levenshteinDistance(output.toLocaleLowerCase(), expected.toLocaleLowerCase())
  const correctnessScore = 1 - distance / Math.max(output.length, expected.length)
  return { correctnessScore, passed: correctnessScore >= PASS_THRESHOLD }
}
