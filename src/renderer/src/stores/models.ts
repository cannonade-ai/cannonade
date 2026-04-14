import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { Model } from '@shared/lm-studio/ipc-contracts'

export const useModelsStore = defineStore('models', () => {
  const models = ref<Model[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      models.value = await api.fetchModels()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to connect to LM Studio'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return { models, loading, error, load }
})
