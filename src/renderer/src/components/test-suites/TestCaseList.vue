<script setup lang="ts">
import { IconPlus, IconChevronDown, IconDotsVertical, IconTrash, IconCopy } from '@tabler/icons-vue'
import type { TestCase } from '@shared/app/test-suite'
import ContextMenu from '@renderer/components/ContextMenu.vue'
import type { ContextMenuItem } from '@renderer/components/ContextMenu.vue'

defineProps<{
  cases: TestCase[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-case': [id: string]
  'add-case': []
  'delete-case': [id: string]
  'clone-case': [id: string]
}>()

function menuItems(id: string): ContextMenuItem[] {
  return [
    {
      label: 'Clone',
      icon: IconCopy,
      action: () => emit('clone-case', id)
    },
    { label: 'Delete', icon: IconTrash, danger: true, action: () => emit('delete-case', id) }
  ]
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">
        Test Cases
        <span class="count-pill">{{ cases.length }}</span>
      </span>
      <button class="btn-add" @click="emit('add-case')">
        <IconPlus :size="13" :stroke-width="2.5" />
        Add New Case
      </button>
    </div>
    <div class="panel-body">
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
        >
          <div class="case-info">
            <span class="case-name">{{ tc.name }}</span>
            <span v-if="tc.description" class="case-desc">{{ tc.description }}</span>
          </div>
          <div class="case-meta">
            <span class="eval-badge">{{ tc.evaluation.type.replace('_', ' ') }}</span>
            <ContextMenu :items="menuItems(tc.id)">
              <template #default="{ toggle }">
                <button class="btn-menu" @click.stop="toggle">
                  <IconDotsVertical :size="14" :stroke-width="2" />
                </button>
              </template>
            </ContextMenu>
            <IconChevronDown
              :size="13"
              :stroke-width="2"
              class="chevron"
              :class="{ rotated: selectedId === tc.id }"
            />
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
  max-height: 19rem;
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

.chevron {
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.chevron.rotated {
  transform: rotate(0deg);
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
