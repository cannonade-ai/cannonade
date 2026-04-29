<script setup lang="ts">
import { onMounted } from 'vue'
import { IconPlayerPlay } from '@tabler/icons-vue'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import type { TestRunConfig } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { Button } from '@renderer/components/ui'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { TestRunList, TestRunDetail, NewRunPanel } from '@renderer/components/test-runs'

const store = useTestRunsStore()
const suitesStore = useTestSuitesStore()

onMounted(() => {
  if (suitesStore.suites.length === 0) suitesStore.load()
})

function onSubmit(config: TestRunConfig, suite: TestSuite): void {
  store.submitRun(config, suite)
}
</script>

<template>
  <div class="view">
    <SectionHeader>
      <Button type="secondary" :icon="IconPlayerPlay" @click="store.startNewRun"> New Run </Button>
    </SectionHeader>

    <div class="panels">
      <TestRunList
        :runs="store.runs"
        :selected-id="store.selectedRunId"
        @select-run="store.selectRun"
      />
      <NewRunPanel
        v-if="store.isCreatingNew"
        :suites="suitesStore.suites"
        @cancel="store.cancelNewRun"
        @submit="onSubmit"
      />
      <TestRunDetail v-else-if="store.selectedRun" :run="store.selectedRun" />
      <div v-else class="empty-detail">
        <IconPlayerPlay :size="24" :stroke-width="1.5" class="empty-icon" />
        <span>Select a run or click New Run</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.panels {
  display: grid;
  grid-template-columns: 20rem 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.btn-new-run {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-new-run:hover {
  background: rgba(255, 179, 0, 0.3);
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: var(--text-sm);
  border: 1px solid var(--border);
  background: var(--surface);
}

.empty-icon {
  opacity: 0.3;
}
</style>
