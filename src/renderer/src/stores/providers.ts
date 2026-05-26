import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../api'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'
import type { ProviderCapabilities } from '@shared/provider/capabilities'

export const useProvidersStore = defineStore('providers', () => {
  const configuredProviders = ref<ConfiguredProvider[]>([])
  const _localProviderOverride = ref<string | null>(null)
  const capabilitiesCache = ref<Record<string, ProviderCapabilities>>({})
  const activeCapabilities = ref<ProviderCapabilities | null>(null)

  const activeLocalProvider = computed<string>(() => {
    const providers = configuredProviders.value
    const override = _localProviderOverride.value
    if (override && providers.some((p) => p.instanceId === override)) return override
    return providers.find((p) => p.isDefault)?.instanceId ?? providers[0]?.instanceId ?? ''
  })

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

  function init(providers: ConfiguredProvider[]): void {
    configuredProviders.value = providers
  }

  function setLocalProvider(instanceId: string): void {
    _localProviderOverride.value = instanceId
  }

  function addProvider(provider: ConfiguredProvider): void {
    if (configuredProviders.value.length === 0) {
      configuredProviders.value = [{ ...provider, isDefault: true }]
    } else {
      configuredProviders.value = [...configuredProviders.value, provider]
    }
  }

  function removeProvider(instanceId: string): void {
    const remaining = configuredProviders.value.filter((p) => p.instanceId !== instanceId)
    const hadDefault = configuredProviders.value.find((p) => p.instanceId === instanceId)?.isDefault
    if (hadDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true }
    }
    configuredProviders.value = remaining
  }

  function setDefault(instanceId: string): void {
    configuredProviders.value = configuredProviders.value.map((p) => ({
      ...p,
      isDefault: p.instanceId === instanceId
    }))
  }

  function updateProvider(updated: ConfiguredProvider): void {
    invalidateCapabilities(updated.instanceId)
    configuredProviders.value = configuredProviders.value.map((p) =>
      p.instanceId === updated.instanceId ? { ...updated, isDefault: p.isDefault } : p
    )
  }

  async function getCapabilities(instanceId: string): Promise<ProviderCapabilities> {
    if (capabilitiesCache.value[instanceId]) {
      return capabilitiesCache.value[instanceId]
    }
    const caps = await api.getCapabilities(instanceId)
    capabilitiesCache.value[instanceId] = caps
    return caps
  }

  function invalidateCapabilities(instanceId: string): void {
    delete capabilitiesCache.value[instanceId]
  }

  function getProvider(instanceId: string): ConfiguredProvider | undefined {
    return configuredProviders.value.find((p) => p.instanceId === instanceId)
  }

  return {
    configuredProviders,
    activeLocalProvider,
    activeCapabilities,
    init,
    setLocalProvider,
    addProvider,
    removeProvider,
    setDefault,
    updateProvider,
    getCapabilities,
    invalidateCapabilities,
    getProvider
  }
})
