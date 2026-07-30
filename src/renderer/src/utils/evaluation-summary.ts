import type { EvaluationConfig } from '@shared/app/test-suite'

type EvaluationSummary = (evaluation: EvaluationConfig) => string | null

const EVALUATION_SUMMARIES: Partial<Record<EvaluationConfig['type'], EvaluationSummary>> = {
  html_validation: (evaluation) => {
    const { allowedTags, blockedTags } = evaluation.htmlValidation ?? {}
    const lines: string[] = []
    if (allowedTags?.length) {
      lines.push(`allowed: ${allowedTags.join(', ')}`)
    }
    if (blockedTags?.length) {
      lines.push(`blocked: ${blockedTags.join(', ')}`)
    }
    return lines.length ? lines.join('\n') : null
  },
  llm_rubric: (evaluation) => {
    const rubric = evaluation.llmRubric?.rubric?.trim()
    return rubric ? rubric : null
  },
  g_eval: (evaluation) => {
    const criteria = evaluation.gEval?.criteria?.map((c) => c.trim()).filter(Boolean)
    return criteria?.length ? criteria.join('\n') : null
  },
  custom: (evaluation) => {
    const code = evaluation.customValidator?.code
    return code ? code : null
  }
}

export function summarizeEvaluation(evaluation: EvaluationConfig): string | null {
  const summarizer = EVALUATION_SUMMARIES[evaluation.type]
  if (summarizer) {
    return summarizer(evaluation)
  }
  if (evaluation.expected == null) {
    return ''
  }
  return typeof evaluation.expected === 'string'
    ? evaluation.expected
    : JSON.stringify(evaluation.expected, undefined, 2)
}
