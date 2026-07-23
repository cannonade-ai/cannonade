import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten'
import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import { createLogger } from '../logger'
import { PASS_THRESHOLD } from './metrics'

const log = createLogger('custom-validator')

const CODE_RUN_TIMEOUT = 5000
const MEMORY_LIMIT_BYTES = 64 * 1024 * 1024

interface ValidatorOutput {
  score: number
  details?: string
}

export async function runCustomValidator(
  output: string,
  evaluation: EvaluationConfig,
  timeoutMs: number = CODE_RUN_TIMEOUT
): Promise<EvaluationResult> {
  if (!evaluation.customValidator?.code) {
    return { score: 0, passed: false, error: 'No custom validator code provided' }
  }
  try {
    const result = await executeInSandbox(evaluation.customValidator.code, output, timeoutMs)
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

async function executeInSandbox(
  code: string,
  output: string,
  timeoutMs: number
): Promise<ValidatorOutput> {
  const quickJS = await getQuickJS()
  const runtime = quickJS.newRuntime()
  runtime.setMemoryLimit(MEMORY_LIMIT_BYTES)
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs))
  const context = runtime.newContext()
  try {
    const outputHandle = context.newString(output)
    context.setProp(context.global, '__output', outputHandle)
    outputHandle.dispose()
    const evalResult = context.evalCode(`JSON.stringify((${code})(__output))`)
    if (evalResult.error) {
      const errorDump: unknown = context.dump(evalResult.error)
      evalResult.error.dispose()
      throw new Error(formatSandboxError(errorDump))
    }
    const resultJson = context.dump(evalResult.value) as string
    evalResult.value.dispose()
    const parsed = JSON.parse(resultJson) as ValidatorOutput
    return { score: parsed.score, details: parsed.details }
  } finally {
    context.dispose()
    runtime.dispose()
  }
}

function formatSandboxError(errorDump: unknown): string {
  if (errorDump && typeof errorDump === 'object') {
    const dump = errorDump as { name?: string; message?: string }
    return `${dump.name ?? 'Error'}: ${dump.message ?? JSON.stringify(errorDump)}`
  }
  return String(errorDump)
}
