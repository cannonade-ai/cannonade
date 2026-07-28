import type { JudgeUsage } from './judge'

export interface EvaluationResult {
  score: number
  passed: boolean
  details?: string
  error?: string

  // usage of the judge model, for eval types graded by an LLM
  judge?: JudgeUsage
}
