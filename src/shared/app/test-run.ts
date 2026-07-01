import type { TestCase, TestCaseResult, AggregateMetrics } from './test-suite'

export interface EvaluationResult {
  score: number
  passed: boolean
  details?: string
  error?: string
}

export interface InstalledModelRef {
  source: 'installed'
  modelKey: string
}

export interface HuggingFaceModelRef {
  source: 'huggingface'
  modelId: string
}

export interface RegistryModelRef {
  source: 'registry'
  modelId: string
}

export type ModelRef = InstalledModelRef | HuggingFaceModelRef | RegistryModelRef

export interface TestRunConfig {
  suiteId: string
  provider: string
  providerName: string
  models: ModelRef[]
  deleteAutoDownloadedModels?: boolean
  unloadModelsBeforeRun?: boolean
  unloadModelsAfterRun?: boolean
  parallelRun?: boolean
  defaultTestCaseTimeout?: number
}

export type RunStatus =
  | 'pending'
  | 'downloading'
  | 'loading'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface TestCaseRun {
  testCaseId: string
  status: RunStatus
  startedAt?: string
  completedAt?: string
  result?: TestCaseResult
}

export interface PerModelRun {
  id: string
  modelRef: ModelRef
  status: RunStatus
  autoDownloaded: boolean
  downloadedBytes?: number
  totalBytes?: number
  estimatedCompletion?: string
  startedAt?: string
  completedAt?: string
  caseRuns: TestCaseRun[]
  aggregate?: AggregateMetrics
  error?: string
}

export interface TestRun {
  id: string
  suiteId: string
  suiteName: string
  testCases?: TestCase[]
  config: TestRunConfig
  status: RunStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  modelRuns: PerModelRun[]
}
