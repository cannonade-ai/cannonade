import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { Provider, ProviderModelMap } from '@shared/provider-model-map'

export type { Provider }

export const useModelsStore = defineStore('models', () => {
  const provider = ref<Provider>('lmstudio')
  const lmModels = ref<ProviderModelMap['lmstudio'][]>([])
  const orModels = ref<ProviderModelMap['openrouter'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (provider.value === 'lmstudio') {
        lmModels.value = await api.fetchModels('lmstudio')
      } else {
        orModels.value = await api.fetchModels('openrouter')
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('fetch failed')) {
          error.value =
            'Cannot connect to LM Studio. Make sure LM Studio is running and the local server is started on port 1234.'
        } else {
          error.value = e.message
        }
      } else {
        error.value = 'Failed to load models'
      }
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return { provider, lmModels, orModels, loading, error, load }
})
