import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import type { JudgeUsage } from '@shared/app/judge'
import type { ChatMessage } from '@shared/provider/chat'
import type { EvaluationContext } from './evaluation-context'
import { callJudge, JudgeError } from './judge/judge-client'
import { parseJudgeSteps, parseJudgeVerdict } from './judge/judge-json'
import { mergeJudgeUsage } from './judge/judge-usage'
import { renderTemplate } from './judge/template'
import { createLogger } from '../logger'

const log = createLogger('g-eval')

const STEPS_SYSTEM_PROMPT = `You turn evaluation criteria into a short checklist a grader can follow.

Given the criteria below, write 3 to 4 concise evaluation steps that check whether a piece of text satisfies them.
Each step must be one sentence, must be applicable to any text, and must not mention any specific text.

Respond with a minified JSON object with a single key "steps". 
Value is a list of strings, like {"steps":["<step 1>","<step 2>","<step 3>"]}.
Respond with the JSON object only. Do not wrap it in code fences and do not add any commentary before or after it.`

const EVALUATE_SYSTEM_PROMPT = `You are grading a reply against evaluation criteria by working through a list of evaluation steps.

Walk through every step, then rate the reply with a single score between 0.0 and 1.0.
1.0 means the criteria are fully and clearly satisfied and 0.0 means they are not satisfied at all.
You respond with a JSON object with this structure: {reason: string, passed: boolean, score: number}

The "reason" is a very concise short justification for the score that cites specific details from the input and the reply.
Never quotes the score itself. The "passed" field is true when the reply satisfies the criteria.
Respond with the JSON object only. Do not wrap it in code fences and do not add any commentary before or after it.
Example: {"reason":"the reply names the missing decrement", "passed":true, "score": 1.0}`

export function buildStepsMessages(criteria: string[]): ChatMessage[] {
  return [
    { role: 'system', content: STEPS_SYSTEM_PROMPT },
    { role: 'user', content: `<Criteria>\n${criteria.join('\n')}\n</Criteria>` }
  ]
}

export function buildEvaluateMessages(
  criteria: string[],
  steps: string[],
  output: string,
  input?: string
): ChatMessage[] {
  const sections = [
    `<Criteria>\n${criteria.join('\n')}\n</Criteria>`,
    `<Steps>\n${steps.map((step) => `- ${step}`).join('\n')}\n</Steps>`
  ]
  if (input?.trim()) sections.push(`<Input>\n${input}\n</Input>`)
  sections.push(`<Output>\n${output}\n</Output>`)

  return [
    { role: 'system', content: EVALUATE_SYSTEM_PROMPT },
    { role: 'user', content: sections.join('\n') }
  ]
}

export async function evaluateGEval(
  output: string,
  evaluation: EvaluationConfig,
  context?: EvaluationContext
): Promise<EvaluationResult> {
  const criteria = resolveCriteria(evaluation, output, context?.input)
  if (criteria.length === 0) {
    return { score: 0, passed: false, error: 'No criteria provided' }
  }
  if (typeof output !== 'string' || !output.trim()) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }

  const usages: JudgeUsage[] = []

  let stepsContent: string
  try {
    const response = await callJudge(buildStepsMessages(criteria), context?.abortSignal)
    stepsContent = response.content
    usages.push(response.usage)
  } catch (err) {
    log.error('judge error while generating steps:', err)
    if (err instanceof JudgeError && !err.fatal) {
      return { score: 0, passed: false, error: err.message }
    }
    throw err
  }

  const steps = parseJudgeSteps(stepsContent)
  if (!steps) {
    log.warn('Could not parse evaluation steps from response:', stepsContent)
    return {
      score: 0,
      passed: false,
      error: `Judge returned unparseable steps: ${truncate(stepsContent)}`,
      judgeUsage: mergeJudgeUsage(usages)
    }
  }

  let verdictContent: string
  try {
    const messages = buildEvaluateMessages(criteria, steps, output, context?.input)
    const response = await callJudge(messages, context?.abortSignal)
    verdictContent = response.content
    usages.push(response.usage)
  } catch (err) {
    log.error('judge error while grading:', err)
    if (err instanceof JudgeError && !err.fatal) {
      return { score: 0, passed: false, error: err.message, judgeUsage: mergeJudgeUsage(usages) }
    }
    throw err
  }

  const judgeUsage = mergeJudgeUsage(usages)
  const verdict = parseJudgeVerdict(verdictContent)
  if (!verdict) {
    log.warn('Could not parse judge verdict from response:', verdictContent)
    return {
      score: 0,
      passed: false,
      error: `Judge returned unparseable output: ${truncate(verdictContent)}`,
      judgeUsage
    }
  }

  const threshold = resolveThreshold(evaluation.threshold)
  const belowThreshold = threshold !== undefined && verdict.score < threshold
  return {
    score: verdict.score,
    passed: verdict.pass && !belowThreshold,
    details:
      verdict.reason ??
      (belowThreshold ? `Score ${verdict.score} below threshold ${threshold}.` : undefined),
    judgeUsage
  }
}

function resolveCriteria(
  evaluation: EvaluationConfig,
  output: string,
  input: string | undefined
): string[] {
  const configured = evaluation.gEval?.criteria
  if (!Array.isArray(configured)) return []

  const criteria: string[] = []
  for (const criterion of configured) {
    if (typeof criterion !== 'string' || !criterion.trim()) continue
    criteria.push(renderTemplate(criterion.trim(), { output: String(output), input: input ?? '' }))
  }
  return criteria
}

function resolveThreshold(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined
}

const MAX_ERROR_LENGTH = 200
function truncate(text: string): string {
  const collapsed = text.replaceAll('\n', ' ').trim()
  return collapsed.length > MAX_ERROR_LENGTH
    ? collapsed.slice(0, MAX_ERROR_LENGTH) + '…'
    : collapsed
}
