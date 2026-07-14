<script setup lang="ts">
import { Input, Select } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'

export type ModalityFilter = 'all' | 'text' | 'multimodal'
export type SortKey = 'newest' | 'name' | 'input-price' | 'output-price' | 'context'

const search = defineModel<string>('search', { required: true })
const modality = defineModel<ModalityFilter>('modality', { required: true })
const sort = defineModel<SortKey>('sort', { required: true })

const modalityOptions: SelectOption<ModalityFilter>[] = [
  { value: 'all', label: 'All modalities' },
  { value: 'text', label: 'Text' },
  { value: 'multimodal', label: 'Multimodal' }
]

const sortOptions: SelectOption<SortKey>[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'input-price', label: 'Input price' },
  { value: 'output-price', label: 'Output price' },
  { value: 'context', label: 'Context length' }
]
</script>

<template>
  <div class="filters">
    <Input
      v-model="search"
      class="filters__search"
      type="text"
      placeholder="Search by name, id, or publisher…"
    />
    <Select v-model="modality" class="filters__select" :options="modalityOptions" />
    <Select v-model="sort" class="filters__select" :options="sortOptions" />
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
}
</style>
