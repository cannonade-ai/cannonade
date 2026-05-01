<script setup lang="ts">
import { IconTestPipe, IconDotsVertical } from '@tabler/icons-vue'
import { formatDate } from '@renderer/utils/format'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { useTestSuiteMenus } from './useTestSuiteMenus'
import type { TestSuite } from '@shared/app/test-suite'

defineProps<{
  suites: TestSuite[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-suite': [id: string]
}>()

const contextMenuStore = useContextMenuStore()
const { suiteMenuItems } = useTestSuiteMenus()
</script>

<template>
  <div class="list-wrap">
    <div v-if="suites.length === 0" class="empty">No test suites yet.</div>
    <ul v-else class="suite-list">
      <li
        v-for="suite in suites"
        :key="suite.id"
        class="suite-item"
        :class="{ active: selectedId === suite.id }"
        @click="emit('select-suite', suite.id)"
      >
        <div class="suite-main">
          <span class="suite-name">{{ suite.name }}</span>
          <span v-if="suite.description" class="suite-desc">{{ suite.description }}</span>
        </div>
        <div class="suite-aside">
          <div class="aside-top">
            <span class="case-count">
              <icon-test-pipe :size="11" :stroke-width="2" />
              {{ suite.testCases.length }} cases
            </span>
            <button
              class="btn-menu"
              @click.stop="
                contextMenuStore.openAt(suiteMenuItems(suite.id), $event.currentTarget as Element)
              "
            >
              <icon-dots-vertical :size="14" :stroke-width="2" />
            </button>
          </div>
          <span class="suite-date">Updated {{ formatDate(suite.updatedAt) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.list-wrap {
  flex: 1;
  overflow-y: auto;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.suite-list {
  list-style: none;
}

.suite-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: var(--list-item-padding);
  border-bottom: 1px solid var(--border);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background 0.12s;
  height: var(--list-item-height);
}

.suite-item:hover {
  background: var(--surface-hover);
}

.suite-item.active {
  background: var(--accent-dim);
  border-left: 2px solid var(--accent);
  padding-left: 18px;
}

.suite-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.suite-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.suite-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 480px;
}

.suite-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.aside-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.case-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.suite-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.btn-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s,
    border-color 0.12s;
}

.btn-menu:hover {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border-color: var(--border);
}
</style>
