<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { ref } from 'vue'
import CopyButton from './CopyButton.vue'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | undefined>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    error?: boolean
    fill?: boolean
    rows?: number
    variant?: 'default' | 'display'
    copyable?: boolean
  }>(),
  {
    disabled: false,
    error: false,
    fill: false,
    variant: 'default',
    copyable: false
  }
)

const textareaEl = ref<HTMLTextAreaElement | null>(null)

function fitHeight(): void {
  const el = textareaEl.value
  if (!el || props.variant !== 'display') return
  el.style.height = '0'
  el.style.height = `${Math.min(el.scrollHeight + 2, 120)}px`
}

onMounted(() => nextTick(fitHeight))
</script>

<template>
  <component
    :is="copyable ? CopyButton : 'div'"
    v-bind="copyable ? { value: model ?? '' } : {}"
    class="textarea-wrap"
    :class="{ 'textarea-wrap--fill': fill }"
  >
    <textarea
      ref="textareaEl"
      v-bind="$attrs"
      v-model="model"
      class="textarea"
      :class="{
        'textarea--error': error,
        'textarea--fill': fill,
        'textarea--display': variant === 'display'
      }"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
    />
  </component>
</template>

<style scoped lang="scss">
.textarea-wrap {
  position: relative;
  width: 100%;
  display: block;

  &--fill {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.textarea {
  display: block;
  width: 100%;
  min-height: 3rem;
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

  &--display {
    border-radius: 0;
    color: var(--text-secondary);
    min-height: unset;
    overflow-y: auto;
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
  }

  &::-webkit-resizer {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cpath d='M9 2L2 9M9 5.5L5.5 9' stroke='rgba(120,120,130,0.5)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: bottom right;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-hover);
    border-radius: var(--radius-full);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  &::-webkit-scrollbar-corner {
    background: transparent;
  }
}
</style>
