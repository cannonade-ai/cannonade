import type { EvaluationConfig, EvaluationMethodResult, TestCase } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import {
  evaluateBleu,
  evaluateContains,
  evaluateExactMatch,
  evaluateF1,
  evaluateJsonMatch,
  evaluateLevenshtein,
  evaluateRegex,
  evaluateRouge,
  PASS_THRESHOLD
} from './metrics'
import { evaluateHtmlValidation } from './html-validation'
import { runCustomValidator } from './customValidator'
import { runCosineSimilarity } from './cosineSimilarity'
import { evaluateLlmRubric } from './llm-rubric'
import { evaluateGEval } from './g-eval'
import type { EvaluationContext } from './evaluation-context'

export interface MultiEvaluationResult {
  score: number
  passed: boolean
  evalResults: EvaluationMethodResult[]
  error?: string
}

export async function evaluateAll(
  output: string,
  testCase: TestCase,
  context?: EvaluationContext
): Promise<MultiEvaluationResult> {
  if (testCase.evaluations.length === 0) {
    return { score: 0, passed: false, evalResults: [], error: 'No evaluation methods configured' }
  }

  const caseContext: EvaluationContext = { ...context, input: testCaseInputText(testCase) }

  const evalResults: EvaluationMethodResult[] = await Promise.all(
    testCase.evaluations.map(async (ev) => {
      const result = await evaluate(output, ev, caseContext)
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

function testCaseInputText(testCase: TestCase): string | undefined {
  const { input } = testCase
  if (input.messages?.length) {
    return input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => m.content)
      .join('\n')
  }
  return input.prompt
}

export async function evaluate(
  output: string,
  evaluation: EvaluationConfig,
  context?: EvaluationContext
): Promise<EvaluationResult> {
  const result = await runMetric(output, evaluation, context)
  return evaluation.negate ? negateResult(result, evaluation) : result
}

async function runMetric(
  output: string,
  evaluation: EvaluationConfig,
  context?: EvaluationContext
): Promise<EvaluationResult> {
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
    case 'json_match':
      return evaluateJsonMatch(output, evaluation)
    case 'bleu':
      return evaluateBleu(output, evaluation)
    case 'html_validation':
      return evaluateHtmlValidation(output, evaluation)
    case 'custom':
      return runCustomValidator(output, evaluation)
    case 'cosine_similarity':
      return runCosineSimilarity(output, evaluation)
    case 'llm_rubric':
      return evaluateLlmRubric(output, evaluation, context)
    case 'g_eval':
      return evaluateGEval(output, evaluation, context)
    default:
      return {
        score: 0,
        passed: false,
        error: `Unsupported eval type: ${(evaluation as EvaluationConfig).type}`
      }
  }
}

function negateResult(result: EvaluationResult, evaluation: EvaluationConfig): EvaluationResult {
  if (result.error) {
    return result
  }
  const score = 1 - result.score
  return {
    ...result,
    score,
    passed: score >= (evaluation.threshold ?? PASS_THRESHOLD)
  }
}
