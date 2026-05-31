import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { TestRun, TestRunConfig, PerModelRun, RunStatus } from '@shared/app/test-run'
import type { TestSuite, TestCaseResult, AggregateMetrics } from '@shared/app/test-suite'
import { executeTestRun } from '../services/test-runner'
import { api } from '../api'
export interface SuiteSummary {
  id: string
  name: string
}

export const useTestRunsStore = defineStore('test-runs', () => {
  const testRuns = ref<TestRun[]>([])
  const selectedRunId = ref<string | null>(null)
  const isCreatingNew = ref(false)
  const abortControllers = new Map<string, AbortController>()

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
    abortControllers.get(id)?.abort()
    abortControllers.delete(id)
  }

  function findModelRun(modelRunId: string): PerModelRun | undefined {
    for (const run of testRuns.value) {
      const mr = run.modelRuns.find((m) => m.id === modelRunId)
      if (mr) return mr
    }
    return undefined
  }

  async function submitRun(config: TestRunConfig, suite: TestSuite): Promise<void> {
    const now = new Date().toISOString()
    const run: TestRun = {
      id: crypto.randomUUID(),
      suiteId: config.suiteId,
      suiteName: suite.name,
      config,
      status: 'pending',
      createdAt: now,
      modelRuns: config.models.map((modelRef) => ({
        id: crypto.randomUUID(),
        modelRef,
        status: 'pending',
        autoDownloaded: false,
        caseRuns: suite.testCases.map((tc) => ({
          testCaseId: tc.id,
          status: 'pending' as RunStatus
        }))
      }))
    }
    testRuns.value.unshift(run)
    selectedRunId.value = run.id
    isCreatingNew.value = false

    const controller = new AbortController()
    abortControllers.set(run.id, controller)

    await executeTestRun(
      run,
      suite,
      {
        onRunStart(runId: string): void {
          const testRun = testRuns.value.find((r) => r.id === runId)
          if (!testRun) return
          testRun.status = 'running'
          testRun.startedAt = new Date().toISOString()
        },
        onModelDownloading(
          modelRunId: string,
          downloadedBytes: number,
          totalBytes: number,
          estimatedCompletion?: string
        ): void {
          const modelRun = findModelRun(modelRunId)
          if (!modelRun) return
          modelRun.status = 'downloading'
          modelRun.downloadedBytes = downloadedBytes
          modelRun.totalBytes = totalBytes
          modelRun.estimatedCompletion = estimatedCompletion
        },
        onModelRunStart(modelRunId: string, autoDownloaded: boolean): void {
          const modelRun = findModelRun(modelRunId)
          if (!modelRun) return
          modelRun.status = 'running'
          modelRun.autoDownloaded = autoDownloaded
          modelRun.startedAt = new Date().toISOString()
        },
        onCaseStart(modelRunId: string, testCaseId: string): void {
          const modelRun = findModelRun(modelRunId)
          const caseRun = modelRun?.caseRuns.find((c) => c.testCaseId === testCaseId)
          if (!caseRun) return
          caseRun.status = 'running'
          caseRun.startedAt = new Date().toISOString()
        },
        onCaseComplete(
          modelRunId: string,
          testCaseId: string,
          result: TestCaseResult,
          aggregate: AggregateMetrics
        ): void {
          const modelRun = findModelRun(modelRunId)
          const caseRun = modelRun?.caseRuns.find((c) => c.testCaseId === testCaseId)
          if (modelRun) {
            modelRun.aggregate = aggregate
          }
          if (!caseRun) return
          caseRun.status = 'completed'
          caseRun.completedAt = new Date().toISOString()
          caseRun.result = result
        },
        onModelRunComplete(
          modelRunId: string,
          status: RunStatus,
          aggregate: AggregateMetrics,
          error?: string
        ): void {
          const modelRun = findModelRun(modelRunId)
          if (!modelRun) return
          modelRun.status = status
          modelRun.completedAt = new Date().toISOString()
          modelRun.aggregate = aggregate
          if (error) modelRun.error = error
        },
        onRunComplete(runId: string, status: RunStatus): void {
          const testRun = testRuns.value.find((r) => r.id === runId)
          if (!testRun) return
          testRun.status = status
          testRun.completedAt = new Date().toISOString()
          abortControllers.delete(runId)
          api.saveTestRun(toRaw(testRun))
        }
      },
      controller.signal
    )
  }

  async function deleteRun(id: string): Promise<void> {
    const index = testRuns.value.findIndex((r) => r.id === id)
    if (index === -1) return
    testRuns.value.splice(index, 1)
    if (selectedRunId.value === id) {
      selectedRunId.value = testRuns.value[0]?.id ?? null
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
    submitRun
  }
})
