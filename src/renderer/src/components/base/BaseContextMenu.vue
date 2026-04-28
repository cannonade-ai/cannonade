<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import { useContextMenuStore } from '@renderer/stores/context-menu'

export interface ContextMenuItem {
  label: string
  icon?: Component
  danger?: boolean
  action: () => void
}

defineProps<{
  items: ContextMenuItem[]
}>()

const store = useContextMenuStore()
const id = Symbol()
const menuRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const open = computed(() => store.isOpen(id))

const DROPDOWN_HEIGHT = 80

function toggle(e: MouseEvent): void {
  e.stopPropagation()
  if (open.value) {
    store.close()
    return
  }
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow >= DROPDOWN_HEIGHT ? rect.bottom + 4 : rect.top - DROPDOWN_HEIGHT - 4
  dropdownStyle.value = {
    top: `${top}px`,
    right: `${window.innerWidth - rect.right}px`
  }
  store.open(id)
}

function openAt(e: MouseEvent): void {
  e.stopPropagation()
  if (open.value) {
    store.close()
    return
  }
  const spaceBelow = window.innerHeight - e.clientY
  const top = spaceBelow >= DROPDOWN_HEIGHT ? e.clientY + 4 : e.clientY - DROPDOWN_HEIGHT - 4
  dropdownStyle.value = {
    top: `${top}px`,
    left: `${e.clientX}px`
  }
  store.open(id)
}

function onItem(item: ContextMenuItem): void {
  store.close()
  item.action()
}

function onDocumentClick(e: MouseEvent): void {
  if (open.value && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    store.close()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('scroll', store.close, true)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('scroll', store.close, true)
})

defineExpose({ openAt })
</script>

<template>
  <div ref="menuRef" class="ctx-menu">
    <slot :toggle="toggle" :open-at="openAt" />
    <Teleport to="body">
      <div v-if="open" class="dropdown" :style="dropdownStyle">
        <button
          v-for="item in items"
          :key="item.label"
          class="dropdown-item"
          :class="{ danger: item.danger }"
          @click.stop="onItem(item)"
        >
          <component :is="item.icon" v-if="item.icon" :size="13" :stroke-width="2" />
          {{ item.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.ctx-menu {
  position: relative;
  display: inline-flex;
}

.dropdown {
  position: fixed;
  z-index: 1000;
  min-width: 6rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  text-align: left;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}
</style>
