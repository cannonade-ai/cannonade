import type { Provider } from '../provider-model-map'
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
  provider: Provider
  models: ModelRef[]
  deleteAutoDownloadedModels?: boolean // for LM Studio only
  parallelRun?: boolean // for OpenRouter only
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface PerModelRun {
  id: string
  modelRef: ModelRef
  status: RunStatus
  autoDownloaded: boolean
  startedAt?: string
  completedAt?: string
  results: TestCaseResult[]
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
