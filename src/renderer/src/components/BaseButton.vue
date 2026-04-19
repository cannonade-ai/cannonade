<script setup lang="ts">
import { computed, toRaw } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'default'
    disabled?: boolean
    icon?: Component
    iconSize?: number
    iconStrokeWidth?: number
  }>(),
  {
    type: 'default',
    disabled: false,
    iconSize: 14,
    iconStrokeWidth: 2
  }
)

const rawIcon = computed(() => (props.icon ? toRaw(props.icon) : undefined))
</script>

<template>
  <button class="base-btn" :class="`base-btn--${type}`" :disabled="disabled">
    <component :is="rawIcon" v-if="rawIcon" :size="iconSize" :stroke-width="iconStrokeWidth" />
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
  opacity: 1;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    opacity 0.15s;
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: unset;
}

.base-btn--default {
  background: none;
  border-color: var(--border);
  color: var(--text-secondary);
}

.base-btn--default:not(:disabled):hover {
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

.base-btn--primary:not(:disabled):hover {
  opacity: 0.7;
}

.base-btn--secondary {
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  color: var(--accent);
}

.base-btn--secondary:not(:disabled):hover {
  background: rgba(255, 179, 0, 0.3);
}

.base-btn--danger-outline {
  background: none;
  border-color: var(--border);
  color: var(--text-secondary);
}

.base-btn--danger-outline:not(:disabled):hover {
  background: color-mix(in srgb, var(--error) 10%, transparent);
  border-color: var(--error);
  color: var(--error);
}

.base-btn--danger {
  background: var(--error);
  border-color: transparent;
  color: var(--text-primary);
}

.base-btn--danger:not(:disabled):hover {
  background: var(--error-dim);
}
</style>
