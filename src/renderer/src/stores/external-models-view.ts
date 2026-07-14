import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ModalityFilter,
  SortKey
} from '@renderer/components/external-models/ExternalModelTableFilters.vue'

export const useExternalModelsViewStore = defineStore('external-models-view', () => {
  const search = ref('')
  const modality = ref<ModalityFilter>('all')
  const sort = ref<SortKey>('newest')
  const page = ref(1)
  const expandedModelIds = ref<string[]>([])
  const scrollTop = ref(0)

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
    modality,
    sort,
    page,
    expandedModelIds,
    scrollTop,
    isExpanded,
    toggleExpanded
  }
})
