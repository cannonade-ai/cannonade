<script setup lang="ts">
import type { TestRun } from '@shared/app/test-run'
import { Badge, Panel, Button, ScrollArea, InfoTooltip } from '@renderer/components/ui'
import { formatDate } from '@renderer/utils/format'
import { IconFolderOpen } from '@tabler/icons-vue'
import { api } from '@renderer/api'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { useAppInfoStore } from '@renderer/stores/app-info'
import { useTestRunMenus } from './useTestRunMenus'

const appInfo = useAppInfoStore()

async function openRunsFolder(): Promise<void> {
  await api.openPath(appInfo.runsDir)
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

const contextMenuStore = useContextMenuStore()
const { runMenuItems } = useTestRunMenus()
</script>

<template>
  <Panel class="runs-panel" title="Test Runs">
    <template #title-addon>
      <Badge>{{ runs.length }}</Badge>
      <InfoTooltip
        content="A run is marked completed when it executes successfully, even if some test cases fail. Failed means the run itself could not finish, e.g. a model failed to load or download."
      />
    </template>
    <template #header-right>
      <Button v-tooltip="'Open runs folder'" type="icon" @click="openRunsFolder">
        <IconFolderOpen :size="15" />
      </Button>
    </template>

    <div v-if="runs.length === 0" class="empty">No runs yet.</div>
    <ScrollArea v-else>
      <ul class="run-list">
        <li
          v-for="run in runs"
          :key="run.id"
          class="run-item"
          :class="{ active: selectedId === run.id }"
          @click="emit('select-run', run.id)"
          @contextmenu.prevent="contextMenuStore.open(runMenuItems(run), $event)"
        >
          <div class="run-info">
            <span class="run-suite">{{ run.suiteName }}</span>
            <span class="run-meta">
              <span class="provider-name">{{
                run.config.providerName ?? run.config.provider
              }}</span>
              &middot; {{ modelCount(run) }}
            </span>
          </div>
          <div class="run-aside">
            <Badge :status="run.status">{{ run.status }}</Badge>
            <span class="run-date">{{ formatDate(run.createdAt) }}</span>
          </div>
        </li>
      </ul>
    </ScrollArea>
  </Panel>
</template>

<style scoped lang="scss">
.runs-panel {
  :deep(.panel__body) {
    padding: 0;
    overflow: hidden;
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
  border-left: var(--inactive-left-border);
  height: var(--list-item-height);

  &.active {
    background: var(--surface-elevated);
    border-left: var(--active-left-border);
  }

  &:hover {
    background: var(--surface-hover);
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
    display: flex;
    font-size: var(--text-xs);
    color: var(--text-secondary);

    .provider-name {
      max-width: 6rem;
      margin-right: 4px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
}

.run-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;

  .badge {
    text-transform: capitalize;
  }

  .run-date {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}
</style>
