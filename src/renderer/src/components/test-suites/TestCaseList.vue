<script setup lang="ts">
import { IconPlus, IconDotsVertical } from '@tabler/icons-vue'
import { Button, Panel, Badge } from '@renderer/components/ui'
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
        @contextmenu.prevent="contextMenuStore.open(testCaseMenuItems(tc.id), $event)"
      >
        <div class="case-title">
          <span class="case-name">{{ tc.name }}</span>
          <Button
            type="icon"
            class="case-menu"
            :icon="IconDotsVertical"
            @click.stop="contextMenuStore.openAt(testCaseMenuItems(tc.id), $event.currentTarget)"
          />
        </div>
        <div class="case-meta">
          <span v-if="tc.description" class="case-desc">{{ tc.description }}</span>
          <span class="eval-badge">
            {{
              tc.evaluations.length > 1
                ? `${tc.evaluations.length} methods`
                : tc.evaluations[0]?.type.replace('_', ' ')
            }}
          </span>
        </div>
      </li>
    </ul>
  </Panel>
</template>

<style scoped lang="scss">
.cases-panel {
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
  flex-direction: column;
  gap: 2px;
  padding: var(--list-item-padding);
  border-left: var(--inactive-left-border);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
  height: var(--list-item-height);

  &.active {
    background: var(--surface-elevated);
    border-left: var(--active-left-border);

    .eval-badge {
      background: var(--accent-bg);
      color: var(--accent);
    }
  }

  &:hover {
    background: var(--surface-hover);

    .case-menu {
      opacity: 1;
      pointer-events: auto;
    }
  }
}

.case-title {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.case-name {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-item .case-menu {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  opacity: 0;
  pointer-events: none;
  padding: 2px 3px;
  height: 1.5rem;
  background: var(--surface-hover);
  transition: opacity 0.12s;

  &:hover {
    background: var(--surface-elevated);
  }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.case-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.case-desc {
  min-width: 0;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eval-badge {
  margin-left: auto;
  flex-shrink: 0;
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
