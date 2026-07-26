<script setup lang="ts">
import { computed } from 'vue'
import { IconSortAscending, IconSortDescending } from '@tabler/icons-vue'
import { Button, Input, Select } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import { ANY_MODALITY, sortOptions } from './external-model-filters'
import type { SortKey } from './external-model-filters'

const props = defineProps<{
  inputModalities: string[]
  outputModalities: string[]
}>()

const viewStore = useExternalModelsViewStore()

const inputOptions = computed<SelectOption<string>[]>(() =>
  buildOptions(props.inputModalities, 'Input')
)

const outputOptions = computed<SelectOption<string>[]>(() =>
  buildOptions(props.outputModalities, 'Output')
)

function buildOptions(modalities: string[], prefix: string): SelectOption<string>[] {
  return [
    { value: ANY_MODALITY, label: `Any ${prefix.toLowerCase()}` },
    ...modalities.map((modality) => ({ value: modality, label: `${prefix}: ${label(modality)}` }))
  ]
}

function label(modality: string): string {
  return modality.charAt(0).toUpperCase() + modality.slice(1)
}

function onSortSelect(key: SortKey | undefined): void {
  if (key) viewStore.setSort(key)
}

const ascending = computed(() => viewStore.sortDirection === 'asc')
</script>

<template>
  <div class="filters">
    <Input
      v-model="viewStore.search"
      class="filters__search"
      type="text"
      placeholder="Search by name, id, or publisher…"
    />
    <Select v-model="viewStore.inputModality" class="filters__select" :options="inputOptions" />
    <Select v-model="viewStore.outputModality" class="filters__select" :options="outputOptions" />
    <Select
      class="filters__select"
      :model-value="viewStore.sort"
      :options="sortOptions"
      @update:model-value="onSortSelect"
    />
    <Button
      v-tooltip:left="'Sort direction'"
      type="icon"
      class="filters__direction"
      :icon="ascending ? IconSortAscending : IconSortDescending"
      :icon-size="16"
      @click="viewStore.toggleSortDirection"
    />
  </div>
</template>

<style scoped lang="scss">
.filters {
  display: flex;
  align-items: center;
  gap: 8px;

  &__search {
    flex: 1;
    min-width: 0;
  }

  &__select {
    width: 10rem;
    flex-shrink: 0;
  }

  &__direction {
    height: 1.875rem;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
}
</style>
