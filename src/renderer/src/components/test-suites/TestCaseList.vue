<script setup lang="ts">
import { IconPlus, IconDotsVertical } from '@tabler/icons-vue'
import { Chevron, Panel, Badge } from '@renderer/components/ui'
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
      <button class="btn-add" @click="emit('add-case')">
        <IconPlus :size="13" :stroke-width="2.5" />
        Add New Case
      </button>
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
          <button
            class="btn-menu"
            @click.stop="
              contextMenuStore.openAt(testCaseMenuItems(tc.id), $event.currentTarget as Element)
            "
          >
            <IconDotsVertical :size="14" :stroke-width="2" />
          </button>
          <Chevron :expanded="selectedId === tc.id" />
        </div>
      </li>
    </ul>
  </Panel>
</template>

<style scoped>
.cases-panel {
  max-height: 19rem;
}

.cases-panel :deep(.panel__body) {
  padding: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: var(--text-xs);
  font-weight: 500;
  font-family: var(--font-body);
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-add:hover {
  background: rgba(255, 179, 0, 0.3);
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
}

.case-item:hover {
  background: var(--surface-hover);
}

.case-item.active {
  background: var(--accent-dim);
  border-left: 2px solid var(--accent-dim);
  padding-left: 12px;
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

.case-item.active .eval-badge {
  background: rgba(255, 179, 0, 0.15);
  color: var(--accent);
}

.btn-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s;
}

.btn-menu:hover {
  background: var(--surface-elevated);
}
</style>
