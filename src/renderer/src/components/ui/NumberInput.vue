<script setup lang="ts">
const model = defineModel<number | undefined>()

function onChange(e: Event): void {
  const val = (e.target as HTMLInputElement).value
  model.value = val === '' ? undefined : parseFloat(val)
}

withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)
</script>

<template>
  <input
    class="number-input"
    type="number"
    :min="min"
    :max="max"
    :step="step"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="model ?? ''"
    @change="onChange"
  />
</template>

<style scoped lang="scss">
.number-input {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  appearance: none;
  transition:
    border-color 0.15s,
    opacity 0.15s;
  line-height: 1.5;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent-border);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
