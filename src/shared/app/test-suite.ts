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

export interface TestCase {
  id: string
  name: string
  description?: string

  input: TestInput

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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
    | 'not_contains'
    | 'json_match'
    | 'regex'
    | 'bleu'
    | 'rouge'
    | 'levenshtein'
    | 'f1'
    | 'custom'
    | 'code_execution'
    | 'cosine_similarity'

  // expected output (if applicable)
  expected?: string | object

  // threshold for similarity-based metrics
  threshold?: number

  // for type: custom
  customValidator?: CustomValidator

  // for type: code_execution
  codeExecution?: CodeExecutionConfig
}

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
}

export interface TestCaseResult {
  testCaseId: string

  output: string

  metrics: {
    tokensPerSecond?: number
    timeToFirstTokenMs?: number
    score?: number
  }

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

  avgScore?: number
}
