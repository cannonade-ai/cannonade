<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  label: string
  active?: boolean
  collapsed?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button class="nav-item" :class="{ active, collapsed }" @click="$emit('click')">
    <component :is="icon" :size="18" :stroke-width="1.75" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 12rem;
  height: 3rem;
  padding: 8px 12px;
  font-size: var(--text-sm);
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-left: var(--inactive-left-border);

  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition:
    background 0.15s,
    border 0.15s,
    color 0.15s,
    padding 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    gap 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: var(--surface-elevated);
    border-left: var(--active-left-border);
    color: var(--text-primary);
  }

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
}

span {
  margin-left: 3px;
  white-space: nowrap;
  overflow: hidden;
  max-width: 200px;
  opacity: 1;
  transition:
    max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
}
</style>
