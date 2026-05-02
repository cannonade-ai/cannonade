<script setup lang="ts">
import { IconPlus, IconDotsVertical } from '@tabler/icons-vue'
import { Button, Chevron, Panel, Badge } from '@renderer/components/ui'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import type { TestCase, TestSuite } from '@shared/app/test-suite'
import { useTestCaseMenus } from './useTestCaseMenus'

const props = defineProps<{
  cases: TestCase[]
  selectedId: string | null
  suite: TestSuite
}>()

const emit = defineEmits<{
  'select-case': [id: string]
  'add-case': []
}>()

const contextMenuStore = useContextMenuStore()
const { testCaseMenuItems } = useTestCaseMenus(props.suite as TestSuite)
console.log(contextMenuStore)
console.log(testCaseMenuItems)

function handleClick(tc: TestCase, e: PointerEvent): void {
  contextMenuStore.open(testCaseMenuItems(tc.id), e)
}
</script>

<template>
  <Panel class="cases-panel" title="Test Cases">
    <template #title-addon>
      <Badge>{{ cases.length }}</Badge>
    </template>

    <template #header-right>
      <Button type="secondary" :icon="IconPlus" :icon-stroke-width="2.5" @click="emit('add-case')">
        New
      </Button>
    </template>

    <div v-if="cases.length === 0" class="empty">
      <span>No test cases yet.</span>
    </div>
    <ul v-else class="case-list">
      <li
        v-for="tc in cases"
        :key="tc.id"
        class="case-item"
        :class="{ active: selectedId === tc.id }"
        @click="emit('select-case', tc.id)"
        @contextmenu.prevent="handleClick(tc, $event)"
      >
        <div class="case-info">
          <span class="case-name">{{ tc.name }}</span>
          <span v-if="tc.description" class="case-desc">{{ tc.description }}</span>
        </div>
        <div class="case-meta">
          <span class="eval-badge">{{ tc.evaluation.type.replace('_', ' ') }}</span>
          <Button
            type="icon"
            :icon="IconDotsVertical"
            @click.stop="contextMenuStore.openAt(testCaseMenuItems(tc.id), $event.currentTarget)"
          />
          <Chevron :expanded="selectedId === tc.id" />
        </div>
      </li>
    </ul>
  </Panel>
</template>

<style scoped lang="scss">
.cases-panel {
  max-height: 19rem;

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

.case-list {
  list-style: none;
}

.case-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--surface-hover);
  }

  &.active {
    background: var(--accent-dim);
    border-left: 2px solid var(--accent-dim);
    padding-left: 12px;

    .eval-badge {
      background: rgba(255, 179, 0, 0.15);
      color: var(--accent);
    }
  }
}

.case-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.case-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.eval-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 7px;
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  text-transform: capitalize;
  letter-spacing: 0.02em;
}
</style>
