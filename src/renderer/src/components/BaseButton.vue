<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    type?: 'primary' | 'secondary' | 'danger' | 'default'
    icon?: Component
    iconSize?: number
    iconStrokeWidth?: number
  }>(),
  {
    type: 'default',
    iconSize: 14,
    iconStrokeWidth: 2
  }
)
</script>

<template>
  <button class="base-btn" :class="`base-btn--${type}`">
    <component :is="icon" v-if="icon" :size="iconSize" :stroke-width="iconStrokeWidth" />
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: var(--text-xs);
  font-weight: 500;
  min-height: 2rem;
  min-width: 6rem;
  font-family: var(--font-body);
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    opacity 0.15s;
}

.base-btn--default {
  background: none;
  border-color: var(--border);
  color: var(--text-secondary);
}

.base-btn--default:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
}

.base-btn--primary {
  font-weight: 600;
  padding: 6px 16px;
  background: var(--accent);
  border-color: transparent;
  color: #000;
}

.base-btn--primary:hover {
  opacity: 0.7;
}

.base-btn--secondary {
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  color: var(--accent);
}

.base-btn--secondary:hover {
  background: rgba(255, 179, 0, 0.3);
}

.base-btn--danger {
  background: none;
  border-color: var(--border);
  color: var(--text-secondary);
}

.base-btn--danger:hover {
  background: color-mix(in srgb, var(--error) 10%, transparent);
  border-color: var(--error);
  color: var(--error);
}
</style>
