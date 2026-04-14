import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { Model as OpenRouterModel } from '@shared/open-router/ipc-contracts'

export type Provider = 'lmstudio' | 'openrouter'

export const useModelsStore = defineStore('models', () => {
  const provider = ref<Provider>('lmstudio')
  const lmModels = ref<Model[]>([])
  const orModels = ref<OpenRouterModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (provider.value === 'lmstudio') {
        lmModels.value = await api.fetchModels()
      } else {
        orModels.value = await api.fetchOpenRouterModels()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load models'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return { provider, lmModels, orModels, loading, error, load }
})
