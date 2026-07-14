<script setup lang="ts">
import { ref } from 'vue'
import { IconX } from '@tabler/icons-vue'

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

function onClear(): void {
  model.value = ''
  validationError.value = false
  inputRef.value?.focus()
}
</script>

<template>
  <div class="input-wrap">
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
    <Transition name="clear-fade">
      <button
        v-if="model && !disabled"
        class="input-wrap__clear"
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
.input-wrap {
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
  transition: opacity 0.15s ease;
}

.clear-fade-enter-from,
.clear-fade-leave-to {
  opacity: 0;
}

.input {
  width: 100%;
  padding: 6px 26px 6px 8px;
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

  &::-webkit-search-cancel-button {
    display: none;
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
