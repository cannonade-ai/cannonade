<script setup lang="ts">
import type { TestRun } from '@shared/app/test-run'
import BaseBadge from '@renderer/components/base/BaseBadge.vue'
import BasePanel from '@renderer/components/base/BasePanel.vue'
import { formatDate } from '@renderer/utils/format'

defineProps<{
  runs: TestRun[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-run': [id: string]
}>()

function modelCount(run: TestRun): string {
  const n = run.config.models.length
  return n === 1 ? '1 model' : `${n} models`
}
</script>

<template>
  <base-panel class="runs-panel" title="Test Runs">
    <template #title-addon>
      <base-badge>{{ runs.length }}</base-badge>
    </template>

    <div v-if="runs.length === 0" class="empty">No runs yet.</div>
    <ul v-else class="run-list">
      <li
        v-for="run in runs"
        :key="run.id"
        class="run-item"
        :class="{ active: selectedId === run.id }"
        @click="emit('select-run', run.id)"
      >
        <div class="run-info">
          <span class="run-suite">{{ run.suiteName }}</span>
          <span class="run-meta">
            {{ run.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter' }}
            &middot; {{ modelCount(run) }}
          </span>
        </div>
        <div class="run-aside">
          <base-badge :status="run.status">{{ run.status }}</base-badge>
          <span class="run-date">{{ formatDate(run.createdAt) }}</span>
        </div>
      </li>
    </ul>
  </base-panel>
</template>

<style scoped>
.runs-panel :deep(.panel__body) {
  padding: 0;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.run-list {
  list-style: none;
}

.run-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: var(--list-item-padding);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
  border-left: 2px solid transparent;
  height: var(--list-item-height);
}

.run-item:hover {
  background: var(--surface-hover);
}

.run-item.active {
  background: var(--accent-dim);
  border-left: 2px solid var(--accent);
}

.run-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.run-suite {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.run-meta {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.run-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.run-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
