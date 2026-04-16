import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TestRun, TestRunConfig } from '@shared/app/test-run'

export interface SuiteSummary {
  id: string
  name: string
}

const mockSuites: SuiteSummary[] = [
  { id: 'suite-1', name: 'Customer Support Eval' },
  { id: 'suite-2', name: 'Code Generation Benchmark' },
  { id: 'suite-3', name: 'RAG Retrieval Quality' }
]

const mockRuns: TestRun[] = [
  {
    id: 'run-1',
    suiteId: 'suite-1',
    suiteName: 'Customer Support Eval',
    config: {
      suiteId: 'suite-1',
      provider: 'openrouter',
      models: [
        { source: 'installed', modelKey: 'anthropic/claude-3-5-sonnet' },
        { source: 'installed', modelKey: 'openai/gpt-4o' }
      ],
      deleteAutoDownloadedModels: false,
      parallelRun: true
    },
    status: 'completed',
    createdAt: '2026-04-15T09:00:00Z',
    startedAt: '2026-04-15T09:01:00Z',
    completedAt: '2026-04-15T09:04:22Z',
    modelRuns: [
      {
        id: 'mr-1',
        modelRef: { source: 'installed', modelKey: 'anthropic/claude-3-5-sonnet' },
        status: 'completed',
        autoDownloaded: false,
        startedAt: '2026-04-15T09:01:00Z',
        completedAt: '2026-04-15T09:03:10Z',
        results: [],
        aggregate: { total: 4, passed: 4, failed: 0, avgCorrectnessScore: 0.96 }
      },
      {
        id: 'mr-2',
        modelRef: { source: 'installed', modelKey: 'openai/gpt-4o' },
        status: 'completed',
        autoDownloaded: false,
        startedAt: '2026-04-15T09:01:00Z',
        completedAt: '2026-04-15T09:04:22Z',
        results: [],
        aggregate: { total: 4, passed: 3, failed: 1, avgCorrectnessScore: 0.81 }
      }
    ]
  },
  {
    id: 'run-2',
    suiteId: 'suite-1',
    suiteName: 'Customer Support Eval',
    config: {
      suiteId: 'suite-1',
      provider: 'lmstudio',
      models: [{ source: 'huggingface', modelId: 'mistralai/Mistral-7B-Instruct-v0.3' }],
      deleteAutoDownloadedModels: true
    },
    status: 'failed',
    createdAt: '2026-04-14T16:30:00Z',
    startedAt: '2026-04-14T16:31:00Z',
    completedAt: '2026-04-14T16:33:45Z',
    modelRuns: [
      {
        id: 'mr-3',
        modelRef: { source: 'huggingface', modelId: 'mistralai/Mistral-7B-Instruct-v0.3' },
        status: 'failed',
        autoDownloaded: true,
        startedAt: '2026-04-14T16:31:00Z',
        completedAt: '2026-04-14T16:33:45Z',
        results: [],
        aggregate: { total: 4, passed: 1, failed: 3 },
        error: 'Model output exceeded context limit on test case 3'
      }
    ]
  },
  {
    id: 'run-3',
    suiteId: 'suite-2',
    suiteName: 'Code Generation Benchmark',
    config: {
      suiteId: 'suite-2',
      provider: 'openrouter',
      models: [{ source: 'installed', modelKey: 'anthropic/claude-3-opus' }],
      deleteAutoDownloadedModels: false
    },
    status: 'running',
    createdAt: '2026-04-16T08:00:00Z',
    startedAt: '2026-04-16T08:00:30Z',
    modelRuns: [
      {
        id: 'mr-4',
        modelRef: { source: 'installed', modelKey: 'anthropic/claude-3-opus' },
        status: 'running',
        autoDownloaded: false,
        startedAt: '2026-04-16T08:00:30Z',
        results: []
      }
    ]
  }
]

export const useTestRunsStore = defineStore('test-runs', () => {
  const runs = ref<TestRun[]>(mockRuns)
  const suites = ref<SuiteSummary[]>(mockSuites)
  const selectedRunId = ref<string | null>(null)
  const isCreatingNew = ref(false)

  const selectedRun = computed<TestRun | null>(
    () => runs.value.find((r) => r.id === selectedRunId.value) ?? null
  )

  function selectRun(id: string): void {
    isCreatingNew.value = false
    selectedRunId.value = selectedRunId.value === id ? null : id
  }

  function startNewRun(): void {
    selectedRunId.value = null
    isCreatingNew.value = true
  }

  function cancelNewRun(): void {
    isCreatingNew.value = false
  }

  function submitRun(config: TestRunConfig): void {
    const suite = suites.value.find((s) => s.id === config.suiteId)
    if (!suite) return
    const now = new Date().toISOString()
    const run: TestRun = {
      id: `run-${Date.now()}`,
      suiteId: config.suiteId,
      suiteName: suite.name,
      config,
      status: 'pending',
      createdAt: now,
      modelRuns: config.models.map((modelRef, i) => ({
        id: `mr-${Date.now()}-${i}`,
        modelRef,
        status: 'pending',
        autoDownloaded: false,
        results: []
      }))
    }
    runs.value.unshift(run)
    selectedRunId.value = run.id
    isCreatingNew.value = false
  }

  return {
    runs,
    suites,
    selectedRunId,
    selectedRun,
    isCreatingNew,
    selectRun,
    startNewRun,
    cancelNewRun,
    submitRun
  }
})
