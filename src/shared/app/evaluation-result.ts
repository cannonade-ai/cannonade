import type { JudgeUsage } from './judge'

export interface EvaluationResult {
  score: number
  passed: boolean
  details?: string
  error?: string
  judgeUsage?: JudgeUsage
}
