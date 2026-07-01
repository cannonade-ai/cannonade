import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'
import { DEFAULT_APP_SETTINGS as DEFAULTS, type FontSize } from '@shared/app/app-settings'
import { useProvidersStore } from './providers'

export type { FontSize }

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
}

export const useSettingsStore = defineStore('settings', () => {
  const providersStore = useProvidersStore()

  const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  const fontSize = ref<FontSize>(DEFAULTS.fontSize)
  const language = ref(DEFAULTS.language)
  const lastSuiteId = ref<string | null>(DEFAULTS.lastSuiteId)
  const autoDeleteModels = ref(DEFAULTS.autoDeleteModels)
  const parallelRuns = ref(DEFAULTS.parallelRuns)
  const defaultTestCaseTimeout = ref(DEFAULTS.defaultTestCaseTimeout)
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
      defaultTestCaseTimeout,
      onboardingComplete,
      () => providersStore.configuredProviders
    ],
    () => {
      api.saveAppSettings({
        isDark: isDark.value,
        fontSize: fontSize.value,
        language: language.value,
        lastSuiteId: lastSuiteId.value,
        autoDeleteModels: autoDeleteModels.value,
        parallelRuns: parallelRuns.value,
        defaultTestCaseTimeout: defaultTestCaseTimeout.value,
        configuredProviders: providersStore.configuredProviders.map((p) => ({ ...p })),
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
    defaultTestCaseTimeout.value = appSettings.defaultTestCaseTimeout
    onboardingComplete.value = appSettings.onboardingComplete ?? false
    providersStore.init(appSettings.configuredProviders ?? [])
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
    defaultTestCaseTimeout.value = DEFAULTS.defaultTestCaseTimeout
    onboardingComplete.value = false
    providersStore.init([])
  }

  function completeOnboarding(): void {
    onboardingComplete.value = true
  }

  return {
    isDark,
    fontSize,
    language,
    lastSuiteId,
    autoDeleteModels,
    parallelRuns,
    defaultTestCaseTimeout,
    onboardingComplete,
    appVersion,
    suitesDir,
    init,
    toggleTheme,
    reset,
    completeOnboarding
  }
})
