<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowDown, IconArrowUp } from '@tabler/icons-vue'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import type { SortKey } from './external-model-filters'

const props = defineProps<{
  label: string
  sortKey: SortKey
  numeric?: boolean
}>()

const viewStore = useExternalModelsViewStore()

const active = computed(() => viewStore.sort === props.sortKey)

const ascending = computed(() => viewStore.sortDirection === 'asc')

const tooltip = computed(() => {
  if (!active.value) return `Sort by ${props.label.toLowerCase()}`
  return 'Reverse sort direction'
})
</script>

<template>
  <button
    v-tooltip="tooltip"
    type="button"
    class="header-cell"
    :class="{ 'header-cell--numeric': numeric, 'header-cell--active': active }"
    @click="viewStore.setSort(sortKey)"
  >
    <span class="header-cell__label">{{ label }}</span>
    <component
      :is="ascending ? IconArrowUp : IconArrowDown"
      v-if="active"
      :size="12"
      :stroke-width="2.5"
      class="header-cell__arrow"
    />
  </button>
</template>

<style scoped lang="scss">
.header-cell {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  color: var(--text-muted);
  transition: color 0.15s;

  &:hover {
    color: var(--text-secondary);
  }

  &--numeric {
    justify-content: flex-end;
  }

  &--active {
    color: var(--text-secondary);
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow {
    flex-shrink: 0;
  }
}
</style>
