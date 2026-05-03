<script setup lang="ts">
import type { TestRun } from '@shared/app/test-run'
import { Badge, Panel, Button } from '@renderer/components/ui'
import { formatDate } from '@renderer/utils/format'
import { IconFolderOpen } from '@tabler/icons-vue'
import { api } from '@renderer/api'

async function openRunsFolder(): Promise<void> {
  const dir = await api.getRunsDir()
  await api.openPath(dir)
}

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
  <Panel class="runs-panel" title="Test Runs">
    <template #title-addon>
      <Badge>{{ runs.length }}</Badge>
    </template>
    <template #header-right>
      <Button type="icon" title="Open runs folder" @click="openRunsFolder">
        <IconFolderOpen :size="15" />
      </Button>
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
          <Badge :status="run.status">{{ run.status }}</Badge>
          <span class="run-date">{{ formatDate(run.createdAt) }}</span>
        </div>
      </li>
    </ul>
  </Panel>
</template>

<style scoped lang="scss">
.runs-panel {
  :deep(.panel__body) {
    padding: 0;
  }
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
  border-left: 3px solid transparent;
  height: var(--list-item-height);

  &:hover {
    background: var(--surface-hover);
  }

  &.active {
    background: var(--surface-elevated);
    border-left: 3px solid var(--accent);
  }
}

.run-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

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
}

.run-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;

  .run-date {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}
</style>
