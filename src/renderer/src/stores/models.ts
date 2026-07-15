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

  const localModels = ref<LocalModel[]>([])
  const localModelsInstanceId = ref<string | null>(null)
  const localModelsUpdatedAt = ref<string | null>(null)
  const externalModels = ref<ExternalModel[]>([])
  const externalModelsInstanceId = ref<string | null>(null)
  const externalModelsUpdatedAt = ref<string | null>(null)
  const externalModelsCache = ref<Record<string, ExternalModel[]>>({})
  const externalModelsUpdatedAtCache = ref<Record<string, string>>({})
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
    if (instanceId !== localModelsInstanceId.value) {
      localModels.value = []
      localModelsInstanceId.value = instanceId
    }
    loading.value = true
    error.value = null
    try {
      localModels.value = await api.fetchLocalModels(instanceId)
      localModelsUpdatedAt.value = new Date().toISOString()
    } catch (e) {
      localModels.value = []
      localModelsUpdatedAt.value = null
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

  async function loadExternalModels(force = false): Promise<void> {
    const instanceId = providersStore.activeExternalProvider
    if (!instanceId) return
    const cached = externalModelsCache.value[instanceId]
    if (!force && cached) {
      externalModels.value = cached
      externalModelsInstanceId.value = instanceId
      externalModelsUpdatedAt.value = externalModelsUpdatedAtCache.value[instanceId] ?? null
      error.value = null
      return
    }
    if (instanceId !== externalModelsInstanceId.value) {
      externalModels.value = []
      externalModelsInstanceId.value = instanceId
    }
    loading.value = true
    error.value = null
    try {
      const models = await api.fetchExternalModels(instanceId)
      externalModelsCache.value[instanceId] = models
      externalModels.value = models
      externalModelsUpdatedAt.value = new Date().toISOString()
      externalModelsUpdatedAtCache.value[instanceId] = externalModelsUpdatedAt.value
    } catch (e) {
      externalModels.value = []
      externalModelsUpdatedAt.value = null
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
    localModels,
    localModelsUpdatedAt,
    externalModels,
    externalModelsUpdatedAt,
    loading,
    error,
    modelOperations,
    setModelOperation,
    loadLocalModels,
    loadExternalModels
  }
})
