import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../api'
import { useSettingsStore } from './settings'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'

export const useModelsStore = defineStore('models', () => {
  const settingsStore = useSettingsStore()

  const _localProviderOverride = ref<string | null>(null)
  const externalProvider = ref<string>('')
  const localModels = ref<LocalModel[]>([])
  const externalModels = ref<ExternalModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const capabilitiesCache = ref<Record<string, ProviderCapabilities>>({})

  const activeLocalProvider = computed<string>(() => {
    const providers = settingsStore.configuredProviders
    const override = _localProviderOverride.value
    if (override && providers.some((p) => p.instanceId === override)) {
      return override
    }
    return providers.find((p) => p.isDefault)?.instanceId ?? providers[0]?.instanceId ?? ''
  })

  function setLocalProvider(instanceId: string): void {
    _localProviderOverride.value = instanceId
  }

  async function loadLocalModels(): Promise<void> {
    const instanceId = activeLocalProvider.value
    if (!instanceId) return
    loading.value = true
    error.value = null
    try {
      localModels.value = await api.fetchLocalModels(instanceId)
    } catch (e) {
      localModels.value = []
      if (e instanceof Error) {
        const providerName =
          settingsStore.configuredProviders.find((p) => p.instanceId === instanceId)?.displayName ??
          instanceId
        if (e.message.includes('fetch failed')) {
          error.value = `Cannot connect to ${providerName}. Make sure the service is running and the server URL is correct.`
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
      externalModels.value = []
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

  async function getCapabilities(instanceId: string): Promise<ProviderCapabilities> {
    if (capabilitiesCache.value[instanceId]) {
      return capabilitiesCache.value[instanceId]
    }
    const capabilities = await api.getCapabilities(instanceId)
    capabilitiesCache.value[instanceId] = capabilities
    return capabilities
  }

  const activeCapabilities = ref<ProviderCapabilities | null>(null)

  watch(
    [activeLocalProvider, () => capabilitiesCache.value[activeLocalProvider.value]],
    async ([instanceId, cached]) => {
      if (!instanceId) {
        activeCapabilities.value = null
        return
      }
      if (cached) {
        activeCapabilities.value = cached
      } else {
        const caps = await api.getCapabilities(instanceId)
        capabilitiesCache.value[instanceId] = caps
      }
    },
    { immediate: true }
  )

  function invalidateCapabilities(instanceId: string): void {
    delete capabilitiesCache.value[instanceId]
  }

  return {
    activeLocalProvider,
    setLocalProvider,
    externalProvider,
    localModels,
    externalModels,
    loading,
    error,
    loadLocalModels,
    loadExternalModels,
    getCapabilities,
    invalidateCapabilities,
    activeCapabilities
  }
})
