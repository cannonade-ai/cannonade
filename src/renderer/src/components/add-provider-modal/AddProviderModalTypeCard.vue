<script setup lang="ts">
import type { Component } from 'vue'
import { computed, toRaw } from 'vue'

const props = defineProps<{
  icon: Component
  label: string
  description: string
  disabled?: boolean
}>()

const rawIcon = computed(() => toRaw(props.icon))

defineEmits<{ click: [] }>()
</script>

<template>
  <button class="type-card" :disabled="disabled" @click="$emit('click')">
    <component :is="rawIcon" :size="20" :stroke-width="1.5" class="type-card__icon" />
    <div class="type-card__body">
      <span class="type-card__label">{{ label }}</span>
      <span class="type-card__desc">{{ description }}</span>
    </div>
    <span v-if="disabled" class="type-card__badge">Added</span>
  </button>
</template>

<style scoped lang="scss">
.type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    border-color 0.12s;
  width: 100%;

  &:not(:disabled):hover {
    background: var(--surface-hover);
    border-color: var(--border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__desc {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  &__badge {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2px 8px;
    flex-shrink: 0;
  }
}
</style>
