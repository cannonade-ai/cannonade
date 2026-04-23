<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconPlayerStop } from '@tabler/icons-vue'
import type { TestRun } from '@shared/app/test-run'
import BaseBadge from '@renderer/components/BaseBadge.vue'
import BaseButton from '@renderer/components/BaseButton.vue'
import BaseModal from '@renderer/components/BaseModal.vue'
import ModelRunRow from '@renderer/components/test-runs/ModelRunRow.vue'
import { useTestRunsStore } from '@renderer/stores/test-runs'

const props = defineProps<{
  run: TestRun
}>()

const store = useTestRunsStore()
const showCancelModal = ref(false)

const isActive = computed(() => props.run.status === 'running' || props.run.status === 'pending')

function confirmCancel(): void {
  store.cancelRun(props.run.id)
  showCancelModal.value = false
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-title">{{ run.suiteName }}</span>
        <base-badge :status="run.status">{{ run.status }}</base-badge>
      </div>
      <div class="header-meta">
        <span class="meta-tag">{{
          run.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'
        }}</span>
        <span v-if="run.config.parallelRun" class="meta-tag">Parallel</span>
        <span class="meta-date">{{ formatDate(run.createdAt) }}</span>
      </div>
    </div>

    <div v-if="isActive" class="panel-toolbar">
      <base-button type="danger-outline" :icon="IconPlayerStop" @click="showCancelModal = true">
        Stop Run
      </base-button>
    </div>

    <base-modal v-model="showCancelModal" title="Stop Run">
      Are you sure you want to stop this run? Any in-progress model evaluations will be cancelled.
      <template #actions="{ close }">
        <base-button @click="close">Cancel</base-button>
        <base-button type="danger-outline" @click="confirmCancel">Stop Run</base-button>
      </template>
    </base-modal>

    <div class="panel-body">
      <div class="section-label">Model Results</div>
      <div class="model-list">
        <model-run-row v-for="mr in run.modelRuns" :key="mr.id" :model-run="mr" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
  height: 3rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: var(--text-sm);
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-tag {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 7px;
  background: var(--surface-elevated);
  color: var(--text-muted);
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.meta-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  font-family: var(--font-headline);
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
