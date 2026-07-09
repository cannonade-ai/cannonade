import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useProvidersStore } from './providers'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import { createLogger } from '../utils/logger'

const log = createLogger('models-store')

export type ModelOperation = 'loading' | 'unloading' | 'deleting'

export const useModelsStore = defineStore('models', () => {
  const providersStore = useProvidersStore()

  const externalProvider = ref<string>('')
  const localModels = ref<LocalModel[]>([])
  const externalModels = ref<ExternalModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const modelOperations = ref<Record<string, ModelOperation>>({})

  function setModelOperation(modelId: string, operation: ModelOperation | null): void {
    if (operation) {
      modelOperations.value[modelId] = operation
    } else {
      delete modelOperations.value[modelId]
    }
  }

  async function loadLocalModels(): Promise<void> {
    const instanceId = providersStore.activeLocalProvider
    if (!instanceId) return
    loading.value = true
    error.value = null
    try {
      localModels.value = await api.fetchLocalModels(instanceId)
    } catch (e) {
      localModels.value = []
      if (e instanceof Error) {
        const providerName = providersStore.getProvider(instanceId)?.displayName ?? instanceId
        if (e.message.includes('fetch failed')) {
          error.value = `Cannot connect to "${providerName}". Make sure the service is running and the server URL is correct.`
        } else {
          error.value = e.message
        }
      } else {
        error.value = 'Failed to load models'
      }
      log.error('Failed to load local models:', error.value)
    } finally {
      loading.value = false
    }
  }

  async function loadExternalModels(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      externalModels.value = await api.fetchExternalModels(externalProvider.value)
    } catch (e) {
      externalModels.value = []
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to load models'
      }
      log.error('Failed to load external models:', error.value)
    } finally {
      loading.value = false
    }
  }

  return {
    externalProvider,
    localModels,
    externalModels,
    loading,
    error,
    modelOperations,
    setModelOperation,
    loadLocalModels,
    loadExternalModels
  }
})
