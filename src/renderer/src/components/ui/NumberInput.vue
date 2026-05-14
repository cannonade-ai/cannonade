<script setup lang="ts">
const model = defineModel<number | undefined>()

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    placeholder?: string
    disabled?: boolean
    alignRight?: boolean
  }>(),
  { disabled: false }
)

const ALLOWED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End'
])

function onKeyDown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey) return
  if (ALLOWED_KEYS.has(e.key)) return

  const input = e.target as HTMLInputElement
  const allowNegative = props.min === undefined || props.min < 0
  const allowDecimal = props.step === undefined || !Number.isInteger(props.step)

  if (e.key === '-' && allowNegative && input.selectionStart === 0 && !input.value.includes('-'))
    return
  if (e.key === '.' && allowDecimal && !input.value.includes('.')) return
  if (/^\d$/.test(e.key)) return

  e.preventDefault()
}

function onBlur(e: Event): void {
  const input = e.target as HTMLInputElement
  const val = input.value.trim()
  if (val === '' || val === '-') {
    model.value = undefined
    input.value = ''
    return
  }
  let n = parseFloat(val)
  if (isNaN(n)) {
    model.value = undefined
    input.value = ''
    return
  }
  if (props.min !== undefined && n < props.min) n = props.min
  if (props.max !== undefined && n > props.max) n = props.max
  model.value = n
  input.value = String(n)
}
</script>

<template>
  <input
    class="number-input"
    :class="{ 'number-input--right': alignRight }"
    type="text"
    inputmode="decimal"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="model ?? ''"
    @keydown="onKeyDown"
    @blur="onBlur"
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

  &--right {
    text-align: right;
  }
}
</style>
