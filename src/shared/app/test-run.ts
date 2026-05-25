import type { TestCaseResult, AggregateMetrics } from './test-suite'

export interface InstalledModelRef {
  source: 'installed'
  modelKey: string
}

export interface HuggingFaceModelRef {
  source: 'huggingface'
  modelId: string
}

export type ModelRef = InstalledModelRef | HuggingFaceModelRef

export interface TestRunConfig {
  suiteId: string
  provider: string
  models: ModelRef[]
  deleteAutoDownloadedModels?: boolean
  unloadModelsAfterRun?: boolean
  parallelRun?: boolean
}

export type RunStatus = 'pending' | 'downloading' | 'running' | 'completed' | 'failed' | 'cancelled'

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
  config: TestRunConfig
  status: RunStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  modelRuns: PerModelRun[]
}
