import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'
import { DEFAULT_APP_SETTINGS as DEFAULTS, type FontSize } from '@shared/app/app-settings'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'
import { useModelsStore } from './models'

export type { FontSize }

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
}

export const useSettingsStore = defineStore('settings', () => {
  const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  const fontSize = ref<FontSize>(DEFAULTS.fontSize)
  const language = ref(DEFAULTS.language)
  const lastSuiteId = ref<string | null>(DEFAULTS.lastSuiteId)
  const autoDeleteModels = ref(DEFAULTS.autoDeleteModels)
  const parallelRuns = ref(DEFAULTS.parallelRuns)
  const defaultTestTimeout = ref(DEFAULTS.defaultTestTimeout)
  const configuredProviders = ref<ConfiguredProvider[]>(DEFAULTS.configuredProviders)
  const onboardingComplete = ref(DEFAULTS.onboardingComplete)
  const appVersion = ref('')
  const suitesDir = ref('')

  applyTheme(isDark.value)

  watch(isDark, (dark) => applyTheme(dark))

  watch(
    [
      isDark,
      fontSize,
      language,
      lastSuiteId,
      autoDeleteModels,
      parallelRuns,
      defaultTestTimeout,
      configuredProviders,
      onboardingComplete
    ],
    () => {
      api.saveAppSettings({
        isDark: isDark.value,
        fontSize: fontSize.value,
        language: language.value,
        lastSuiteId: lastSuiteId.value,
        autoDeleteModels: autoDeleteModels.value,
        parallelRuns: parallelRuns.value,
        defaultTestTimeout: defaultTestTimeout.value,
        configuredProviders: configuredProviders.value.map((p) => ({ ...p })),
        onboardingComplete: onboardingComplete.value
      })
    }
  )

  async function init(): Promise<void> {
    const [version, dir, appSettings] = await Promise.all([
      api.getAppVersion(),
      api.getSuitesDir(),
      api.loadAppSettings()
    ])
    appVersion.value = version
    suitesDir.value = dir
    isDark.value = appSettings.isDark
    fontSize.value = appSettings.fontSize
    language.value = appSettings.language
    lastSuiteId.value = appSettings.lastSuiteId
    autoDeleteModels.value = appSettings.autoDeleteModels
    parallelRuns.value = appSettings.parallelRuns
    defaultTestTimeout.value = appSettings.defaultTestTimeout
    configuredProviders.value = appSettings.configuredProviders ?? []
    onboardingComplete.value = appSettings.onboardingComplete ?? false
  }

  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  function reset(): void {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    fontSize.value = DEFAULTS.fontSize
    language.value = DEFAULTS.language
    autoDeleteModels.value = DEFAULTS.autoDeleteModels
    parallelRuns.value = DEFAULTS.parallelRuns
    defaultTestTimeout.value = DEFAULTS.defaultTestTimeout
    configuredProviders.value = []
    onboardingComplete.value = false
  }

  function completeOnboarding(): void {
    onboardingComplete.value = true
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
    useModelsStore().invalidateCapabilities(updated.instanceId)
    configuredProviders.value = configuredProviders.value.map((p) =>
      p.instanceId === updated.instanceId ? { ...updated, isDefault: p.isDefault } : p
    )
  }

  return {
    isDark,
    fontSize,
    language,
    lastSuiteId,
    autoDeleteModels,
    parallelRuns,
    defaultTestTimeout,
    configuredProviders,
    onboardingComplete,
    appVersion,
    suitesDir,
    init,
    toggleTheme,
    reset,
    addProvider,
    removeProvider,
    updateProvider,
    setDefault,
    completeOnboarding
  }
})
