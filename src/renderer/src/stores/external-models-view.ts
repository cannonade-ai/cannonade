import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExternalModel } from '@shared/provider/external-model'
import {
  ANY_MODALITY,
  defaultSortDirections
} from '@renderer/components/external-models/external-model-filters'
import type {
  SortDirection,
  SortKey
} from '@renderer/components/external-models/external-model-filters'

export const useExternalModelsViewStore = defineStore('external-models-view', () => {
  const search = ref('')
  const inputModality = ref<string>(ANY_MODALITY)
  const outputModality = ref<string>(ANY_MODALITY)
  const sort = ref<SortKey>('created')
  const sortDirection = ref<SortDirection>('desc')
  const page = ref(1)
  const expandedModelIds = ref<string[]>([])
  const scrollTop = ref(0)
  const rawJsonModel = ref<ExternalModel | null>(null)

  function setSort(key: SortKey): void {
    if (sort.value === key) {
      toggleSortDirection()
      return
    }
    sort.value = key
    sortDirection.value = defaultSortDirections[key]
  }

  function toggleSortDirection(): void {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }

  function isExpanded(modelId: string): boolean {
    return expandedModelIds.value.includes(modelId)
  }

  function toggleExpanded(modelId: string): void {
    if (isExpanded(modelId)) {
      expandedModelIds.value = expandedModelIds.value.filter((id) => id !== modelId)
    } else {
      expandedModelIds.value = [...expandedModelIds.value, modelId]
    }
  }

  return {
    search,
    inputModality,
    outputModality,
    sort,
    sortDirection,
    page,
    expandedModelIds,
    scrollTop,
    rawJsonModel,
    setSort,
    toggleSortDirection,
    isExpanded,
    toggleExpanded
  }
})
