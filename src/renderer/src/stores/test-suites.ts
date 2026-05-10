import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import type { TestCase, TestSuite } from '@shared/app/test-suite'

function migrateTestCase(tc: TestCase & { evaluation?: unknown }): TestCase {
  if (tc.evaluation && !tc.evaluations) {
    const { evaluation, ...rest } = tc
    return { ...rest, evaluations: [evaluation as TestCase['evaluations'][0]], passingLogic: 'all' }
  }
  return tc
}

function migrateSuite(suite: TestSuite): TestSuite {
  return { ...suite, testCases: suite.testCases.map(migrateTestCase) }
}

export const useTestSuitesStore = defineStore('test-suites', () => {
  const suites = ref<TestSuite[]>([])
  const loading = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      suites.value = (await api.listSuites()).map(migrateSuite)
    } finally {
      loading.value = false
    }
  }

  async function save(suite: TestSuite): Promise<void> {
    suite.updatedAt = new Date().toISOString()
    await api.saveSuite(JSON.parse(JSON.stringify(toRaw(suite))))
    const idx = suites.value.findIndex((s) => s.id === suite.id)
    if (idx !== -1) {
      suites.value[idx] = suite
    } else {
      suites.value.push(suite)
    }
  }

  async function remove(id: string): Promise<void> {
    await api.deleteSuite(id)
    suites.value = suites.value.filter((s) => s.id !== id)
  }

  function create(): TestSuite {
    const now = new Date().toISOString()
    return {
      id: crypto.randomUUID(),
      name: 'New Test Suite',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      defaultRunConfig: {},
      testCases: []
    }
  }

  function clone(id: string): TestSuite | null {
    const original = suites.value.find((s) => s.id === id)
    if (!original) return null
    const now = new Date().toISOString()
    return {
      ...JSON.parse(JSON.stringify(original)),
      id: crypto.randomUUID(),
      name: `Copy of ${original.name}`,
      createdAt: now,
      updatedAt: now
    }
  }

  return { suites, loading, load, save, remove, create, clone }
})
