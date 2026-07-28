import type { ChatMessage } from '../provider/chat'
import type { JudgeUsage } from './judge'

export interface TestSuite {
  id: string
  name: string
  description?: string

  version: string

  createdAt: string
  updatedAt: string

  defaultRunConfig?: RunConfig

  testCases: TestCase[]
}

export interface TestCasePromptRef {
  promptId: string
  version: number | 'latest'
}

export interface TestCase {
  id: string
  name: string
  description?: string

  input: TestInput

  promptRef?: TestCasePromptRef

  evaluations: EvaluationConfig[]
  passingLogic: 'all' | 'any'

  runConfig?: RunConfig

  timeoutMs?: number
}

export interface TestInput {
  type: 'chat' | 'completion' | 'json' | 'code'

  // for chat models
  messages?: ChatMessage[]

  // for completion models
  prompt?: string

  // optional structured input (useful for programmatic validation)
  data?: Record<string, unknown>
}

export interface RunConfig {
  temperature?: number
  topP?: number
  topK?: number
  minP?: number
  repeatPenalty?: number
  presencePenalty?: number
  frequencyPenalty?: number
  seed?: number
  maxTokens?: number

  providerOptions?: Record<string, unknown>
}

export interface EvaluationConfig {
  type:
    | 'exact_match'
    | 'contains'
    | 'json_match'
    | 'regex'
    | 'bleu'
    | 'rouge'
    | 'levenshtein'
    | 'f1'
    | 'custom'
    | 'code_execution'
    | 'cosine_similarity'
    | 'html_validation'
    | 'llm_rubric'

  negate?: boolean // inverts the result: the eval passes when it would otherwise fail
  caseSensitive?: boolean // for text-comparison metrics: whether matching distinguishes letter case
  expected?: string | object // expected output (if applicable)
  threshold?: number // threshold for similarity-based metrics
  customValidator?: CustomValidator // for type: custom
  codeExecution?: CodeExecutionConfig // for type: code_execution
  htmlValidation?: HtmlValidationConfig // for type: html_validation
  llmRubric?: LlmRubricConfig // for type: llm_rubric
}

export interface LlmRubricConfig {
  // free-text criterion the judge model grades the output against
  // supports {{output}} and {{input}} placeholders
  rubric: string
}

export interface HtmlValidationConfig {
  // when set, only these tags count as valid; everything else lowers the score
  allowedTags?: string[]

  // these tags lower the score whenever they appear
  blockedTags?: string[]
}

export const CASE_SENSITIVE_METRICS: EvaluationConfig['type'][] = [
  'exact_match',
  'contains',
  'regex',
  'rouge',
  'levenshtein',
  'f1',
  'bleu'
]

export interface CustomValidator {
  language: 'javascript'

  // function as string:
  // (output) => { score: number; details?: string }
  code: string
}

export interface CodeExecutionConfig {
  language: 'javascript' | 'python'

  testCases: CodeTestCase[]

  executionTemplate?: string
}

export interface CodeTestCase {
  input: unknown
  expectedOutput: unknown
}

export interface TestSuiteRun {
  id: string

  suiteId: string

  startedAt: string
  completedAt?: string

  model: string

  results: TestCaseResult[]

  aggregate: AggregateMetrics
}

export interface EvaluationMethodResult {
  type: EvaluationConfig['type']
  score: number
  passed: boolean
  details?: string
  error?: string
  judge?: JudgeUsage
}

export interface RunCostBreakdown {
  promptCost?: number
  completionCost?: number
}

export interface TestCaseMetrics {
  tokensPerSecond?: number
  timeToFirstTokenMs?: number
  score?: number
  durationMs?: number

  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number

  cost?: number
  costBreakdown?: RunCostBreakdown
  judge?: JudgeUsage
}

export interface TestCaseResult {
  testCaseId: string
  output: string
  reasoning?: string
  metrics: TestCaseMetrics
  passed: boolean
  evalResults: EvaluationMethodResult[]
  error?: string
}

export interface AggregateMetrics {
  total: number
  passed: number
  failed: number

  avgTokensPerSecond?: number
  minTokensPerSecond?: number
  maxTokensPerSecond?: number

  avgTimeToFirstTokenMs?: number
  minTimeToFirstTokenMs?: number
  maxTimeToFirstTokenMs?: number

  avgDurationMs?: number
  minDurationMs?: number
  maxDurationMs?: number
  totalDurationMs?: number

  totalCost?: number
  totalTokens?: number

  totalJudgeCost?: number
  totalJudgeTokens?: number

  avgScore?: number
}
