<script setup lang="ts">
import { IconPlayerPlay } from '@tabler/icons-vue'
import { useTestRunsStore } from '../stores/test-runs'
import type { TestRunConfig } from '@shared/app/test-run'
import SectionHeader from '../components/SectionHeader.vue'
import TestRunList from '../components/test-runs/TestRunList.vue'
import TestRunDetail from '../components/test-runs/TestRunDetail.vue'
import NewRunPanel from '../components/test-runs/NewRunPanel.vue'

const store = useTestRunsStore()

function onSubmit(config: TestRunConfig): void {
  store.submitRun(config)
}
</script>

<template>
  <div class="view">
    <section-header>
      <button class="btn-new-run" @click="store.startNewRun">
        <IconPlayerPlay :size="14" :stroke-width="2.5" />
        New Run
      </button>
    </section-header>

    <div class="panels">
      <TestRunList
        :runs="store.runs"
        :selected-id="store.selectedRunId"
        @select-run="store.selectRun"
      />
      <NewRunPanel
        v-if="store.isCreatingNew"
        :suites="store.suites"
        @cancel="store.cancelNewRun"
        @submit="onSubmit"
      />
      <TestRunDetail
        v-else-if="store.selectedRun"
        :run="store.selectedRun"
      />
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
  grid-template-columns: 280px 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.btn-new-run {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
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
  font-size: 0.82rem;
  border: 1px solid var(--border);
  background: var(--surface);
}

.empty-icon {
  opacity: 0.3;
}
</style>
