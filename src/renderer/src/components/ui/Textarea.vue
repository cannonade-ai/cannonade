<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    error?: boolean
    fill?: boolean
    rows?: number
  }>(),
  {
    disabled: false,
    error: false,
    fill: false
  }
)
</script>

<template>
  <textarea
    v-model="model"
    class="textarea"
    :class="{ 'textarea--error': error, 'textarea--fill': fill }"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  />
</template>

<style scoped lang="scss">
.textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  resize: vertical;
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

  &--fill {
    flex: 1;
    resize: none;
    height: 100%;
  }

  &--error {
    border-color: var(--error);

    &:focus {
      border-color: var(--error);
    }
  }
}
</style>
