<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'
import SectionHeader from '../components/SectionHeader.vue'
import TestSuiteList from '../components/test-suites/TestSuiteList.vue'
import TestSuiteDetail from '../components/test-suites/TestSuiteDetail.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BasePanel from '../components/base/BasePanel.vue'
import BaseBadge from '../components/base/BaseBadge.vue'
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

      <base-panel class="suites-panel" title="Test Suites">
        <template #title-addon>
          <base-badge>{{ suites.length }}</base-badge>
        </template>

        <TestSuiteList
          :suites="suites"
          :selected-id="selectedId"
          @select-suite="onSelectSuite"
          @delete-suite="onDeleteSuite"
          @clone-suite="onCloneSuite"
        />
      </base-panel>
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

.suites-panel {
  flex: 1;
}

.suites-panel :deep(.panel__body) {
  padding: 0;
}
</style>
