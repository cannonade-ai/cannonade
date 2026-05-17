import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'
import {
  DEFAULT_APP_SETTINGS as DEFAULTS,
  DEFAULT_LM_STUDIO_URL,
  type FontSize
} from '@shared/app/app-settings'

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
  const lmStudioUrl = ref(DEFAULT_LM_STUDIO_URL)
  const lmStudioRemote = ref(DEFAULTS.lmStudioRemote)
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
      lmStudioUrl,
      lmStudioRemote
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
        lmStudioUrl: lmStudioUrl.value,
        lmStudioRemote: lmStudioRemote.value
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
    lmStudioUrl.value = appSettings.lmStudioUrl
    lmStudioRemote.value = appSettings.lmStudioRemote
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
    lmStudioUrl.value = DEFAULT_LM_STUDIO_URL
    lmStudioRemote.value = DEFAULTS.lmStudioRemote
  }

  return {
    isDark,
    fontSize,
    language,
    lastSuiteId,
    autoDeleteModels,
    parallelRuns,
    defaultTestTimeout,
    lmStudioUrl,
    lmStudioRemote,
    appVersion,
    suitesDir,
    init,
    toggleTheme,
    reset
  }
})
