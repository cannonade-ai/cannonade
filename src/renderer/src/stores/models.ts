import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import type { LocalProviderId, ExternalProviderId, ProviderId } from '@shared/provider/ids'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'

export const useModelsStore = defineStore('models', () => {
  const localProvider = ref<LocalProviderId>('lmstudio')
  const externalProvider = ref<ExternalProviderId>('openrouter')
  const localModels = ref<LocalModel[]>([])
  const externalModels = ref<ExternalModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const capabilitiesCache = ref<Partial<Record<ProviderId, ProviderCapabilities>>>({})

  async function loadLocalModels(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      localModels.value = await api.fetchLocalModels(localProvider.value)
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('fetch failed')) {
          error.value = `Cannot connect to ${localProvider.value}. Make sure the service is running and the server URL is correct.`
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

  async function loadExternalModels(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      externalModels.value = await api.fetchExternalModels(externalProvider.value)
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to load models'
      }
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function getCapabilities(providerId: ProviderId): Promise<ProviderCapabilities> {
    if (capabilitiesCache.value[providerId]) {
      return capabilitiesCache.value[providerId]!
    }
    const capabilities = await api.getCapabilities(providerId)
    capabilitiesCache.value[providerId] = capabilities
    return capabilities
  }

  return {
    localProvider,
    externalProvider,
    localModels,
    externalModels,
    loading,
    error,
    loadLocalModels,
    loadExternalModels,
    getCapabilities
  }
})
