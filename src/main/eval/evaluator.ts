import type { EvaluationConfig, EvaluationMethodResult, TestCase } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import {
  evaluateBleu,
  evaluateContains,
  evaluateExactMatch,
  evaluateF1,
  evaluateJsonMatch,
  evaluateLevenshtein,
  evaluateNotContains,
  evaluateRegex,
  evaluateRouge
} from './metrics'
import { runCustomValidator } from './customValidator'
import { runCosineSimilarity } from './cosineSimilarity'

export interface MultiEvaluationResult {
  score: number
  passed: boolean
  evalResults: EvaluationMethodResult[]
  error?: string
}

export async function evaluateAll(
  output: string,
  testCase: TestCase
): Promise<MultiEvaluationResult> {
  if (testCase.evaluations.length === 0) {
    return { score: 0, passed: false, evalResults: [], error: 'No evaluation methods configured' }
  }

  const evalResults: EvaluationMethodResult[] = await Promise.all(
    testCase.evaluations.map(async (ev) => {
      const result = await evaluate(output, ev)
      return { type: ev.type, ...result }
    })
  )

  const passed =
    testCase.passingLogic === 'all'
      ? evalResults.every((r) => r.passed)
      : evalResults.some((r) => r.passed)

  const score = evalResults.reduce((sum, r) => sum + r.score, 0) / evalResults.length

  return { score, passed, evalResults }
}

export async function evaluate(
  output: string,
  evaluation: EvaluationConfig
): Promise<EvaluationResult> {
  switch (evaluation.type) {
    case 'exact_match':
      return evaluateExactMatch(output, evaluation)
    case 'contains':
      return evaluateContains(output, evaluation)
    case 'not_contains':
      return evaluateNotContains(output, evaluation)
    case 'regex':
      return evaluateRegex(output, evaluation)
    case 'rouge':
      return evaluateRouge(output, evaluation)
    case 'levenshtein':
      return evaluateLevenshtein(output, evaluation)
    case 'f1':
      return evaluateF1(output, evaluation)
    case 'json_match':
      return evaluateJsonMatch(output, evaluation)
    case 'bleu':
      return evaluateBleu(output, evaluation)
    case 'custom':
      return runCustomValidator(output, evaluation)
    case 'cosine_similarity':
      return runCosineSimilarity(output, evaluation)
    default:
      return {
        score: 0,
        passed: false,
        error: `Unsupported eval type: ${(evaluation as EvaluationConfig).type}`
      }
  }
}
