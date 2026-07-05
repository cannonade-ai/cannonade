import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TestRun, TestRunConfig, PerModelRun, RunStatus } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { api } from '../api'
import { usePromptsStore } from './prompts'

export interface SuiteSummary {
  id: string
  name: string
}

export const useTestRunsStore = defineStore('test-runs', () => {
  const testRuns = ref<TestRun[]>([])
  const selectedRunId = ref<string | null>(null)
  const isCreatingNew = ref(false)

  const selectedRun = computed<TestRun | null>(
    () => testRuns.value.find((r) => r.id === selectedRunId.value) ?? null
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

  async function load(): Promise<void> {
    testRuns.value = await api.listTestRuns()
  }

  function cancelRun(id: string): void {
    api.abortRun(id)
  }

  function findModelRun(modelRunId: string): PerModelRun | undefined {
    for (const run of testRuns.value) {
      const mr = run.modelRuns.find((m) => m.id === modelRunId)
      if (mr) return mr
    }
    return undefined
  }

  function initEventListeners(): void {
    api.onRunStarted(({ runId }) => {
      const testRun = testRuns.value.find((r) => r.id === runId)
      if (!testRun) return
      testRun.status = 'running'
      testRun.startedAt = new Date().toISOString()
    })

    api.onModelDownloading(({ modelRunId, downloadedBytes, totalBytes, estimatedCompletion }) => {
      const modelRun = findModelRun(modelRunId)
      if (!modelRun) return
      modelRun.status = 'downloading'
      modelRun.downloadedBytes = downloadedBytes
      modelRun.totalBytes = totalBytes
      modelRun.estimatedCompletion = estimatedCompletion
    })

    api.onModelLoading(({ modelRunId }) => {
      const modelRun = findModelRun(modelRunId)
      if (!modelRun) return
      modelRun.status = 'loading'
    })

    api.onModelStarted(({ modelRunId, autoDownloaded }) => {
      const modelRun = findModelRun(modelRunId)
      if (!modelRun) return
      modelRun.status = 'running'
      modelRun.autoDownloaded = autoDownloaded
      modelRun.startedAt = new Date().toISOString()
    })

    api.onCaseStarted(({ modelRunId, testCaseId }) => {
      const modelRun = findModelRun(modelRunId)
      const caseRun = modelRun?.caseRuns.find((c) => c.testCaseId === testCaseId)
      if (!modelRun || !caseRun) return
      modelRun.status = 'running'
      caseRun.status = 'running'
      caseRun.startedAt = new Date().toISOString()
    })

    api.onCaseCompleted(({ modelRunId, testCaseId, status, result, aggregate }) => {
      const modelRun = findModelRun(modelRunId)
      const caseRun = modelRun?.caseRuns.find((c) => c.testCaseId === testCaseId)
      if (modelRun) {
        modelRun.aggregate = aggregate
      }
      if (!caseRun) return
      caseRun.status = status ?? 'completed'
      caseRun.completedAt = new Date().toISOString()
      caseRun.result = result
    })

    api.onModelCompleted(({ modelRunId, status, aggregate, error }) => {
      const modelRun = findModelRun(modelRunId)
      if (!modelRun) return
      modelRun.status = status
      modelRun.completedAt = new Date().toISOString()
      modelRun.aggregate = aggregate
      if (error) modelRun.error = error
    })

    api.onRunCompleted(({ runId, status }) => {
      const testRun = testRuns.value.find((r) => r.id === runId)
      if (!testRun) return
      testRun.status = status
      testRun.completedAt = new Date().toISOString()
    })
  }

  async function submitRun(config: TestRunConfig, suite: TestSuite): Promise<void> {
    const promptsStore = usePromptsStore()
    await promptsStore.ensureLoaded()
    const resolvedSuite: TestSuite = {
      ...suite,
      testCases: promptsStore.resolveTestCases(suite.testCases)
    }
    const now = new Date().toISOString()
    const run: TestRun = {
      id: crypto.randomUUID(),
      suiteId: config.suiteId,
      suiteName: resolvedSuite.name,
      testCases: resolvedSuite.testCases,
      config,
      status: 'pending',
      createdAt: now,
      modelRuns: config.models.map((modelRef) => ({
        id: crypto.randomUUID(),
        modelRef,
        status: 'pending',
        autoDownloaded: false,
        caseRuns: resolvedSuite.testCases.map((tc) => ({
          testCaseId: tc.id,
          status: 'pending' as RunStatus
        }))
      }))
    }
    testRuns.value.unshift(run)
    selectedRunId.value = run.id
    isCreatingNew.value = false
    await api.startRun(JSON.parse(JSON.stringify(run)), JSON.parse(JSON.stringify(resolvedSuite)))
  }

  async function deleteRun(id: string): Promise<void> {
    const index = testRuns.value.findIndex((r) => r.id === id)
    if (index === -1) return
    testRuns.value.splice(index, 1)
    if (selectedRunId.value === id) {
      selectedRunId.value = (testRuns.value[index] ?? testRuns.value[index - 1])?.id ?? null
    }
    await api.deleteTestRun(id)
  }

  return {
    runs: testRuns,
    selectedRunId,
    selectedRun,
    isCreatingNew,
    load,
    selectRun,
    startNewRun,
    cancelNewRun,
    cancelRun,
    deleteRun,
    submitRun,
    initEventListeners
  }
})
