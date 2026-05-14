<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
}>()
</script>

<template>
  <div class="row">
    <div class="row-label">
      <span class="row-name">{{ label }}</span>
      <span v-if="hint" class="row-hint">{{ hint }}</span>
    </div>
    <div class="row-control">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
}

.row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.row-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.row-control {
  flex-shrink: 0;
}
</style>
