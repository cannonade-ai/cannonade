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

  // expected output OR validation rules
  evaluation: EvaluationConfig

  // override suite-level config if needed
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
  provider: 'lmstudio' | 'openrouter'

  model: string

  temperature?: number
  maxTokens?: number
  topP?: number

  frequencyPenalty?: number
  presencePenalty?: number

  providerOptions?: Record<string, unknown>
}

export interface EvaluationConfig {
  type:
    | 'exact_match'
    | 'json_match'
    | 'regex'
    | 'bleu'
    | 'rouge'
    | 'mrr'
    | 'custom'
    | 'code_execution'

  // expected output (if applicable)
  expected?: string | object

  // threshold for similarity-based metrics
  threshold?: number

  // for type: custom
  customValidator: CustomValidator

  // for type: code_execution
  codeExecution: CodeExecutionConfig
}

export interface CustomValidator {
  language: 'javascript'

  // function as string:
  // (output, expected, context) => { score: number; passed: boolean; details?: any }
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

export interface TestCaseResult {
  testCaseId: string

  output: string

  metrics: {
    tokensPerSecond?: number
    timeToFirstTokenMs?: number
    correctnessScore?: number
  }

  passed: boolean

  error?: string

  details?: unknown
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

  avgCorrectnessScore?: number
}
