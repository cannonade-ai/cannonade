import { VM } from 'vm2'
import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import { createLogger } from '../logger'
import { PASS_THRESHOLD } from './metrics'

const log = createLogger('custom-validator')

const CODE_RUN_TIMEOUT = 5000

export function runCustomValidator(output: string, evaluation: EvaluationConfig): EvaluationResult {
  if (!evaluation.customValidator?.code) {
    return { score: 0, passed: false, error: 'No custom validator code provided' }
  }
  try {
    const vm = new VM({ timeout: CODE_RUN_TIMEOUT, allowAsync: false, sandbox: {} })
    const fn = vm.run(`(${evaluation.customValidator.code})`) as (output: string) => {
      score: number
      details?: string
    }
    const result = fn(output)
    const score = Math.min(1, Math.max(0, result.score))
    return {
      score,
      passed: score >= (evaluation.threshold ?? PASS_THRESHOLD),
      details: result.details
    }
  } catch (err) {
    log.error('Custom validator evaluation failed:', err)
    return { score: 0, passed: false, error: `Custom validator error: ${err}` }
  }
}
