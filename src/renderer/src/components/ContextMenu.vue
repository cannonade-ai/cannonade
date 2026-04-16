<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'

export interface ContextMenuItem {
  label: string
  icon?: Component
  danger?: boolean
  action: () => void
}

defineProps<{
  items: ContextMenuItem[]
}>()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggle(e: MouseEvent): void {
  e.stopPropagation()
  open.value = !open.value
}

function onDocumentClick(e: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onItem(item: ContextMenuItem): void {
  open.value = false
  item.action()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="menuRef" class="ctx-menu">
    <slot :toggle="toggle" />
    <div v-if="open" class="dropdown">
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
  </div>
</template>

<style scoped>
.ctx-menu {
  position: relative;
  display: inline-flex;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 130px;
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
  font-size: 0.8rem;
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
}

.dropdown-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: #ef4444;
}

.dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>
