import type { EvaluationConfig } from '@shared/app/test-suite'

export interface EvaluationResult {
  correctnessScore: number
  passed: boolean
  details?: string
  error?: string
}

const PASS_THRESHOLD = 0.9

export function evaluate(output: string, evaluation: EvaluationConfig): EvaluationResult {
  switch (evaluation.type) {
    case 'exact_match':
      return evaluateExactMatch(output, evaluation)
    case 'contains':
      return evaluateContains(output, evaluation)
    case 'regex':
      return evaluateRegex(output, evaluation)
    default:
      return { correctnessScore: 0, passed: false, error: 'Evaluation type not implemented yet' }
  }
}

function evaluateExactMatch(output: string, evaluation: EvaluationConfig): EvaluationResult {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  const correctnessScore = output.trim() === expected.trim() ? 1 : 0
  return { correctnessScore, passed: correctnessScore > PASS_THRESHOLD }
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
    passed: correctnessScore > PASS_THRESHOLD,
    details: `${matched.length}/${terms.length} terms found`
  }
}
