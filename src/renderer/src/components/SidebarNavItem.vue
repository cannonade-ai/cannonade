<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  label: string
  active?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button class="nav-item" :class="{ active }" @click="$emit('click')">
    <component :is="icon" :size="18" :stroke-width="1.75" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  text-align: left;
}

.nav-item:hover {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--surface-elevated);
  color: var(--text-primary);
  font-weight: 600;
}
</style>
