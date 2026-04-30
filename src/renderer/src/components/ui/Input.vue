<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    error?: boolean
    type?: 'text' | 'password' | 'email' | 'search'
  }>(),
  {
    type: 'text',
    disabled: false,
    error: false
  }
)
</script>

<template>
  <input
    v-model="model"
    class="input"
    :class="{ 'input--error': error }"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.input {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
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

  &--error {
    border-color: var(--error);

    &:focus {
      border-color: var(--error);
    }
  }
}
</style>
