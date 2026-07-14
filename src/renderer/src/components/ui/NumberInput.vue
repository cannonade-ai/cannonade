<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconX } from '@tabler/icons-vue'

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

const inputRef = ref<HTMLInputElement | null>(null)
const hasValue = ref(model.value !== undefined)

watch(model, (value) => {
  hasValue.value = value !== undefined
})

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

function onInput(e: Event): void {
  hasValue.value = (e.target as HTMLInputElement).value !== ''
}

function onBlur(e: Event): void {
  const input = e.target as HTMLInputElement
  const val = input.value.trim()
  if (val === '' || val === '-') {
    model.value = undefined
    input.value = ''
    hasValue.value = false
    return
  }
  let n = parseFloat(val)
  if (isNaN(n)) {
    model.value = undefined
    input.value = ''
    hasValue.value = false
    return
  }
  if (props.min !== undefined && n < props.min) n = props.min
  if (props.max !== undefined && n > props.max) n = props.max
  model.value = n
  input.value = String(n)
  hasValue.value = true
}

function onClear(): void {
  model.value = undefined
  if (inputRef.value) inputRef.value.value = ''
  hasValue.value = false
  inputRef.value?.focus()
}
</script>

<template>
  <div class="number-input-wrap">
    <input
      ref="inputRef"
      class="number-input"
      :class="{ 'number-input--right': alignRight }"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="model ?? ''"
      @keydown="onKeyDown"
      @input="onInput"
      @blur="onBlur"
    />
    <Transition name="clear-fade">
      <button
        v-if="hasValue && !disabled"
        class="number-input-wrap__clear"
        type="button"
        tabindex="-1"
        @mousedown.prevent
        @click="onClear"
      >
        <IconX :size="14" />
      </button>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.number-input-wrap {
  position: relative;
  width: 100%;

  &__clear {
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
      color: var(--text-primary);
    }
  }
}

.clear-fade-enter-active,
.clear-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.clear-fade-enter-from,
.clear-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.6);
}

.number-input {
  width: 100%;
  padding: 6px 26px 6px 8px;
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
