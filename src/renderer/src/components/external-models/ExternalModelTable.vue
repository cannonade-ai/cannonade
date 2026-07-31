<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Pagination } from '@renderer/components/ui'
import type { ExternalModel } from '@shared/provider/external-model'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import ExternalModelRawJsonModal from './ExternalModelRawJsonModal.vue'
import ExternalModelTableFilters from './ExternalModelTableFilters.vue'
import ExternalModelTableHeaderCell from './ExternalModelTableHeaderCell.vue'
import ExternalModelTableRow from './ExternalModelTableRow.vue'
import {
  ANY_MODALITY,
  collectModalities,
  createModelComparator,
  matchesModality,
  matchesQuery
} from './external-model-filters'

const props = defineProps<{ models: ExternalModel[] }>()

const PAGE_SIZE = 50

const viewStore = useExternalModelsViewStore()
const { search, inputModality, outputModality, sort, sortDirection, page } = storeToRefs(viewStore)

watch([search, inputModality, outputModality, sort, sortDirection, () => props.models], () => {
  page.value = 1
})

const inputModalities = computed<string[]>(() =>
  collectModalities(props.models, (m) => m.inputModalities)
)

const outputModalities = computed<string[]>(() =>
  collectModalities(props.models, (m) => m.outputModalities)
)

watch(inputModalities, (available) => {
  if (!available.includes(inputModality.value)) inputModality.value = ANY_MODALITY
})

watch(outputModalities, (available) => {
  if (!available.includes(outputModality.value)) outputModality.value = ANY_MODALITY
})

const filtered = computed<ExternalModel[]>(() => {
  const query = search.value.trim().toLowerCase()
  return props.models.filter(
    (m) =>
      matchesModality(m.inputModalities, inputModality.value) &&
      matchesModality(m.outputModalities, outputModality.value) &&
      matchesQuery(m, query)
  )
})

const sorted = computed<ExternalModel[]>(() =>
  [...filtered.value].sort(createModelComparator(sort.value, sortDirection.value))
)

const paged = computed<ExternalModel[]>(() =>
  sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
</script>

<template>
  <div class="model-table">
    <ExternalModelTableFilters
      :input-modalities="inputModalities"
      :output-modalities="outputModalities"
    />

    <div v-if="sorted.length === 0" class="empty-state">No models match your filters.</div>

    <template v-else>
      <div class="table-header">
        <ExternalModelTableHeaderCell class="cell cell--name" label="Model" sort-key="name" />
        <ExternalModelTableHeaderCell
          class="cell cell--num"
          label="Context"
          sort-key="context"
          numeric
        />
        <ExternalModelTableHeaderCell
          class="cell cell--num"
          label="Input"
          sort-key="input-price"
          numeric
        />
        <ExternalModelTableHeaderCell
          class="cell cell--num"
          label="Output"
          sort-key="output-price"
          numeric
        />
        <span class="cell cell--actions" />
        <span class="cell cell--chevron" />
      </div>

      <div class="table-body">
        <ExternalModelTableRow v-for="model in paged" :key="model.id" :model="model" />
      </div>

      <Pagination v-model:page="page" :page-size="PAGE_SIZE" :total="sorted.length" />
    </template>

    <ExternalModelRawJsonModal />
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

  &--actions {
    width: 1.625rem;
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
