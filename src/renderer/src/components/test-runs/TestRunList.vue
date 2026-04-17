<script setup lang="ts">
import {
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconClock,
  IconCircleMinus
} from '@tabler/icons-vue'
import type { TestRun, RunStatus } from '@shared/app/test-run'

defineProps<{
  runs: TestRun[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-run': [id: string]
}>()

const statusIconMap: Record<RunStatus, unknown> = {
  completed: IconCircleCheck,
  failed: IconCircleX,
  running: IconLoader2,
  pending: IconClock,
  cancelled: IconCircleMinus
}

function statusIcon(status: RunStatus) {
  return statusIconMap[status]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function modelCount(run: TestRun): string {
  const n = run.config.models.length
  return n === 1 ? '1 model' : `${n} models`
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">
        Test Runs
        <span class="count-pill">{{ runs.length }}</span>
      </span>
    </div>
    <div class="panel-body">
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
            <span class="status-badge" :class="run.status">
              <component :is="statusIcon(run.status)" :size="11" :stroke-width="2.5" />
              {{ run.status }}
            </span>
            <span class="run-date">{{ formatDate(run.createdAt) }}</span>
          </div>
        </li>
      </ul>
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
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 3rem;
}

.panel-title {
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

.panel-body {
  flex: 1;
  overflow-y: auto;
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

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  letter-spacing: 0.02em;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.running {
  background: var(--accent-dim);
  color: var(--accent);
}

.status-badge.pending,
.status-badge.cancelled {
  background: var(--surface-elevated);
  color: var(--text-muted);
}

.run-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
