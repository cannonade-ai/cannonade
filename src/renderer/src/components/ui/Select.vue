<script setup lang="ts" generic="T extends string">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectOption<V extends string = string> {
  value: V
  label: string
}

const props = defineProps<{
  options: SelectOption<T>[]
  placeholder?: string
}>()

const model = defineModel<T>()

const open = ref(false)
const focused = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? props.placeholder ?? ''
)

function toggle(): void {
  open.value = !open.value
  if (open.value) {
    focused.value = props.options.findIndex((o) => o.value === model.value)
  }
}

function select(value: T): void {
  model.value = value
  open.value = false
  focused.value = -1
}

function onKeydown(e: KeyboardEvent): void {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open.value = true
      focused.value = props.options.findIndex((o) => o.value === model.value)
    }
    return
  }
  if (e.key === 'Escape') {
    open.value = false
    focused.value = -1
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    focused.value = Math.min(focused.value + 1, props.options.length - 1)
    scrollFocusedIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focused.value = Math.max(focused.value - 1, 0)
    scrollFocusedIntoView()
  } else if (e.key === 'Enter' && focused.value >= 0) {
    e.preventDefault()
    select(props.options[focused.value].value)
  }
}

function scrollFocusedIntoView(): void {
  if (!listRef.value) return
  const item = listRef.value.children[focused.value] as HTMLElement | undefined
  item?.scrollIntoView({ block: 'nearest' })
}

function onDocumentClick(e: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
    focused.value = -1
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div
    ref="rootRef"
    class="select"
    :class="{ open }"
    tabindex="0"
    role="combobox"
    :aria-expanded="open"
    @click="toggle"
    @keydown="onKeydown"
  >
    <span class="trigger-label" :class="{ placeholder: !model && !!placeholder }">{{
      selectedLabel
    }}</span>
    <svg class="trigger-icon" width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div v-if="open" class="dropdown" role="listbox" @click.stop>
      <ul ref="listRef">
        <li
          v-for="(option, i) in options"
          :key="option.value"
          class="option"
          :class="{ selected: option.value === model, focused: i === focused }"
          role="option"
          :aria-selected="option.value === model"
          @click="select(option.value)"
          @mouseenter="focused = i"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.select {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 1.875rem;
  box-sizing: border-box;
  padding: 0.375rem 0.75rem;
  padding-right: 2rem;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
  user-select: none;

  &.open {
    border-color: var(--accent);
  }

  &.open {
    .trigger-icon {
      transform: rotate(180deg);
    }
  }

  .trigger-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.placeholder {
      color: var(--text-muted);
    }
  }

  .trigger-icon {
    position: absolute;
    right: 8px;
    color: var(--text-muted);
    transition: transform 0.15s;
    pointer-events: none;
    flex-shrink: 0;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 200;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    overflow: hidden;

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 14rem;
      overflow-y: auto;
    }

    .option {
      padding: 6px 8px;
      font-size: var(--text-xs);
      font-family: var(--font-body);
      color: var(--text-secondary);
      border-radius: calc(var(--radius) - 2px);
      cursor: pointer;
      transition:
        background 0.1s,
        color 0.1s;

      &.focused {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &.selected {
        color: var(--accent);
      }
    }
  }
}
</style>
