<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Pagination } from '@renderer/components/ui'
import { isMultimodal } from '@shared/provider/external-model'
import type { ExternalModel } from '@shared/provider/external-model'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import ExternalModelTableFilters from './ExternalModelTableFilters.vue'
import type { SortKey } from './ExternalModelTableFilters.vue'
import ExternalModelTableRow from './ExternalModelTableRow.vue'

const props = defineProps<{ models: ExternalModel[] }>()

const PAGE_SIZE = 50

const viewStore = useExternalModelsViewStore()
const { search, modality, sort, page } = storeToRefs(viewStore)

watch([search, modality, sort, () => props.models], () => {
  page.value = 1
})

const filtered = computed<ExternalModel[]>(() => {
  const query = search.value.trim().toLowerCase()
  return props.models.filter((m) => {
    if (modality.value === 'text' && isMultimodal(m)) return false
    if (modality.value === 'multimodal' && !isMultimodal(m)) return false
    if (!query) return true
    return (
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query) ||
      m.publisher.toLowerCase().includes(query)
    )
  })
})

const comparators: Record<SortKey, (a: ExternalModel, b: ExternalModel) => number> = {
  newest: (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
  name: (a, b) => a.name.localeCompare(b.name),
  'input-price': (a, b) =>
    (a.pricing?.inputPerMTokens ?? -Infinity) - (b.pricing?.inputPerMTokens ?? -Infinity),
  'output-price': (a, b) =>
    (a.pricing?.outputPerMTokens ?? -Infinity) - (b.pricing?.outputPerMTokens ?? -Infinity),
  context: (a, b) => b.contextLength - a.contextLength
}

const sorted = computed<ExternalModel[]>(() => [...filtered.value].sort(comparators[sort.value]))

const paged = computed<ExternalModel[]>(() =>
  sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
</script>

<template>
  <div class="model-table">
    <ExternalModelTableFilters
      v-model:search="search"
      v-model:modality="modality"
      v-model:sort="sort"
    />

    <div v-if="sorted.length === 0" class="empty-state">No models match your filters.</div>

    <template v-else>
      <div class="table-header">
        <span class="cell cell--name">Model</span>
        <span class="cell cell--num">Context</span>
        <span class="cell cell--num">Input</span>
        <span class="cell cell--num">Output</span>
        <span class="cell cell--chevron" />
      </div>

      <div class="table-body">
        <ExternalModelTableRow v-for="model in paged" :key="model.id" :model="model" />
      </div>

      <Pagination v-model:page="page" :page-size="PAGE_SIZE" :total="sorted.length" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.model-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.cell {
  &--name {
    flex: 1;
    min-width: 0;
  }

  &--num {
    width: 5.5rem;
    text-align: right;
    flex-shrink: 0;
  }

  &--chevron {
    width: 14px;
    flex-shrink: 0;
  }
}

.table-body {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  :deep(.model-row:last-child) {
    border-bottom: none;
  }
}

.empty-state {
  color: var(--text-muted);
  font-size: var(--text-sm);
  padding: 40px 0;
  text-align: center;
}
</style>
