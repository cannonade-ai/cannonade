import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/evaluation-result'
import type { ChatMessage } from '@shared/provider/chat'
import type { EvaluationContext } from './evaluation-context'
import { callJudge, JudgeError } from './judge/judge-client'
import { parseJudgeVerdict } from './judge/judge-json'
import { renderTemplate } from './judge/template'
import { PASS_THRESHOLD } from './metrics'
import { createLogger } from '../logger'

const log = createLogger('llm-rubric')

const JUDGE_SYSTEM_PROMPT = `You are grading output according to a user-specified rubric. If the statement in the rubric is true, then the output passes the test. You respond with a JSON object with this structure: {reason: string, pass: boolean, score: number}

Examples:

<Output>Hello world</Output>
<Rubric>Content contains a greeting</Rubric>
{"reason": "the content contains the word 'Hello'", "pass": true, "score": 1.0}

<Output>Avast ye swabs, repel the invaders!</Output>
<Rubric>Does not speak like a pirate</Rubric>
{"reason": "'avast ye' is a common pirate term", "pass": false, "score": 0.0}

<Input>Why does this loop never terminate?</Input>
<Output>The counter is never incremented, so the condition stays true forever.</Output>
<Rubric>Correctly explains why the code fails</Rubric>
{"reason": "the output identifies the missing increment as the cause", "pass": true, "score": 1.0}

Respond with the JSON object only. Do not wrap it in code fences and do not add any commentary before or after it.`

export function buildRubricMessages(output: string, rubric: string, input?: string): ChatMessage[] {
  const rendered = renderTemplate(rubric, { output, input: input ?? '' })
  const sections = input?.trim() ? [`<Input>\n${input}\n</Input>`] : []
  sections.push(`<Output>\n${output}\n</Output>`, `<Rubric>\n${rendered}\n</Rubric>`)

  return [
    { role: 'system', content: JUDGE_SYSTEM_PROMPT },
    { role: 'user', content: sections.join('\n') }
  ]
}

export async function evaluateLlmRubric(
  output: string,
  evaluation: EvaluationConfig,
  context?: EvaluationContext
): Promise<EvaluationResult> {
  const rubric = evaluation.llmRubric?.rubric?.trim()
  if (!rubric) {
    return { score: 0, passed: false, error: 'No rubric provided' }
  }
  if (!output.trim()) {
    return { score: 0, passed: false, error: 'Model output was empty' }
  }

  const messages = buildRubricMessages(output, rubric, context?.input)

  let content: string
  let judge: EvaluationResult['judge']
  try {
    const response = await callJudge(messages, context?.abortSignal)
    content = response.content
    judge = response.usage
  } catch (err) {
    if (err instanceof JudgeError) {
      return { score: 0, passed: false, error: err.message }
    }
    throw err
  }

  const verdict = parseJudgeVerdict(content)
  if (!verdict) {
    log.warn('Could not parse judge verdict from response:', content)
    return {
      score: 0,
      passed: false,
      error: `Judge returned unparseable output: ${truncate(content)}`,
      judge
    }
  }

  const threshold = evaluation.threshold ?? PASS_THRESHOLD
  return {
    score: verdict.score,
    passed: verdict.score >= threshold,
    details: verdict.reason,
    judge
  }
}

const MAX_ERROR_LENGTH = 200
function truncate(text: string): string {
  const collapsed = text.replaceAll('\n', ' ').trim()
  return collapsed.length > MAX_ERROR_LENGTH
    ? collapsed.slice(0, MAX_ERROR_LENGTH) + '…'
    : collapsed
}
