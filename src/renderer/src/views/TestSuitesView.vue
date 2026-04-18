<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'
import SectionHeader from '../components/SectionHeader.vue'
import TestSuiteList from '../components/test-suites/TestSuiteList.vue'
import TestSuiteDetail from '../components/test-suites/TestSuiteDetail.vue'
import BaseButton from '../components/BaseButton.vue'
import { storeToRefs } from 'pinia'
import { useTestSuitesStore } from '../stores/test-suites'

const store = useTestSuitesStore()
const { suites } = storeToRefs(store)
const selectedId = ref<string | null>(null)

const selectedSuite = computed<TestSuite | null>(
  () => suites.value.find((s) => s.id === selectedId.value) ?? null
)

onMounted(() => store.load())

function onSelectSuite(id: string): void {
  selectedId.value = id
}

function onBack(): void {
  selectedId.value = null
}

async function onSave(updated: TestSuite): Promise<void> {
  await store.save(updated)
}

async function onNewSuite(): Promise<void> {
  const suite = store.create()
  await store.save(suite)
  selectedId.value = suite.id
}

async function onDeleteSuite(id: string): Promise<void> {
  await store.remove(id)
  if (selectedId.value === id) selectedId.value = null
}

async function onCloneSuite(id: string): Promise<void> {
  const clone = store.clone(id)
  if (!clone) return
  await store.save(clone)
}
</script>

<template>
  <div class="view">
    <template v-if="selectedSuite">
      <TestSuiteDetail :suite="selectedSuite" @back="onBack" @save="onSave" />
    </template>

    <template v-else>
      <section-header>
        <base-button type="secondary" :icon="IconPlus" @click="onNewSuite">New Suite</base-button>
      </section-header>

      <div class="list-panel">
        <div class="list-header">
          <span class="list-title">
            Test Suites
            <span class="count-pill">{{ suites.length }}</span>
          </span>
        </div>
        <TestSuiteList
          :suites="suites"
          :selected-id="selectedId"
          @select-suite="onSelectSuite"
          @delete-suite="onDeleteSuite"
          @clone-suite="onCloneSuite"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.list-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.list-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 3rem;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--text-xs);
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.count-pill {
  font-size: var(--text-xs);
  background: var(--surface-elevated);
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-new:hover {
  background: rgba(255, 179, 0, 0.3);
}
</style>
