<script setup lang="ts" generic="T extends string">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

export interface SelectOption<V extends string = string> {
  value: V
  label: string
}

const props = defineProps<{
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
}>()

const model = defineModel<T>()

const open = ref(false)
const focused = ref(-1)
const query = ref('')
const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? props.placeholder ?? ''
)

const filteredOptions = computed<SelectOption<T>[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!props.searchable || !q) return props.options
  return props.options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  )
})

watch(filteredOptions, (options) => {
  if (focused.value >= options.length) focused.value = options.length - 1
})

function openDropdown(): void {
  open.value = true
  query.value = ''
  focused.value = filteredOptions.value.findIndex((o) => o.value === model.value)
  if (props.searchable) {
    void nextTick(() => searchRef.value?.focus())
  }
}

function closeDropdown(): void {
  open.value = false
  focused.value = -1
  query.value = ''
}

function toggle(): void {
  if (props.disabled) return
  if (open.value) closeDropdown()
  else openDropdown()
}

function select(value: T): void {
  model.value = value
  closeDropdown()
}

function onKeydown(e: KeyboardEvent): void {
  if (props.disabled) return
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
    return
  }
  if (e.key === 'Escape') {
    closeDropdown()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    focused.value = Math.min(focused.value + 1, filteredOptions.value.length - 1)
    scrollFocusedIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focused.value = Math.max(focused.value - 1, 0)
    scrollFocusedIntoView()
  } else if (e.key === 'Enter' && focused.value >= 0) {
    e.preventDefault()
    const option = filteredOptions.value[focused.value]
    if (option) select(option.value)
  }
}

function scrollFocusedIntoView(): void {
  if (!listRef.value) return
  const item = listRef.value.children[focused.value] as HTMLElement | undefined
  item?.scrollIntoView({ block: 'nearest' })
}

function onDocumentClick(e: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div
    ref="rootRef"
    class="select"
    :class="{ open, disabled }"
    :tabindex="disabled ? -1 : 0"
    role="combobox"
    :aria-expanded="open"
    :aria-disabled="disabled"
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
      <input
        v-if="searchable"
        ref="searchRef"
        v-model="query"
        class="search"
        type="text"
        placeholder="Search…"
        @input="focused = 0"
      />
      <div v-if="filteredOptions.length === 0" class="no-results">No matches</div>
      <ul v-else ref="listRef">
        <li
          v-for="(option, i) in filteredOptions"
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

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

    .search {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      font-size: var(--text-xs);
      font-family: var(--font-body);
      color: var(--text-primary);
      background: var(--surface);
      border: none;
      border-bottom: 1px solid var(--border);
      outline: none;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .no-results {
      padding: 8px;
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

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
