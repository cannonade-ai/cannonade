<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string>({ required: true })

const emit = defineEmits<{
  submit: []
}>()

withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    error?: boolean
    type?: 'text' | 'password' | 'email' | 'search' | 'url'
    alignRight?: boolean
    maxlength?: number
  }>(),
  {
    type: 'text',
    disabled: false,
    error: false
  }
)

const inputRef = ref<HTMLInputElement | null>(null)
const validationError = ref(false)

function onInput(): void {
  validationError.value = inputRef.value ? !inputRef.value.checkValidity() : false
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}
</script>

<template>
  <input
    ref="inputRef"
    v-model="model"
    class="input"
    :class="{ 'input--error': error || validationError, 'input--right': alignRight }"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxlength"
    @input="onInput"
    @keydown="onKeydown"
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

  &--right {
    text-align: right;
  }
}
</style>
