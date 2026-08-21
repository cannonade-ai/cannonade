import { defineStore } from 'pinia'
import { nextTick, reactive, toRaw, toRefs, watch } from 'vue'
import { api } from '../api'
import {
  DEFAULT_APP_SETTINGS as DEFAULTS,
  type AppSettings,
  type FontSize
} from '@shared/app/app-settings'
import { useProvidersStore } from './providers'
import { createLogger } from '../utils/logger'

const log = createLogger('settings-store')

export type { FontSize }

type PersistedSettings = Omit<AppSettings, 'configuredProviders'>

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
}

export const useSettingsStore = defineStore('settings', () => {
  const providersStore = useProvidersStore()

  const settings = reactive<PersistedSettings>({
    ...DEFAULTS,
    judge: { ...DEFAULTS.judge },
    experiments: { ...DEFAULTS.experiments },
    fieldVisibility: { ...DEFAULTS.fieldVisibility },
    isDark: window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  applyTheme(settings.isDark)

  watch(
    () => settings.isDark,
    (dark) => applyTheme(dark)
  )

  let initialized = false
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function saveSettings(): void {
    api
      .saveAppSettings({
        ...toRaw(settings),
        judge: { ...settings.judge },
        experiments: { ...settings.experiments },
        fieldVisibility: { ...settings.fieldVisibility },
        configuredProviders: providersStore.configuredProviders.map((p) => ({ ...p }))
      })
      .catch((err) => log.error('Failed to save app settings:', err))
  }

  watch(
    [settings, () => providersStore.configuredProviders],
    () => {
      if (!initialized) return
      if (saveTimer !== null) clearTimeout(saveTimer)
      saveTimer = setTimeout(saveSettings, 500)
    },
    { deep: true }
  )

  async function init(): Promise<void> {
    const loadedSettings = await api.loadAppSettings()
    Object.assign(settings, loadedSettings, {
      onboardingComplete: loadedSettings.onboardingComplete ?? false,
      htmlPreviewTemplate: loadedSettings.htmlPreviewTemplate ?? DEFAULTS.htmlPreviewTemplate,
      htmlPreviewByDefault: loadedSettings.htmlPreviewByDefault ?? DEFAULTS.htmlPreviewByDefault,
      judge: loadedSettings.judge ? { ...loadedSettings.judge } : { ...DEFAULTS.judge },
      experiments: { ...DEFAULTS.experiments, ...loadedSettings.experiments },
      fieldVisibility: { ...DEFAULTS.fieldVisibility, ...loadedSettings.fieldVisibility }
    })
    providersStore.init(loadedSettings.configuredProviders ?? [])
    await nextTick()
    initialized = true
  }

  function toggleTheme(): void {
    settings.isDark = !settings.isDark
  }

  function reset(): void {
    Object.assign(settings, DEFAULTS, {
      judge: { ...DEFAULTS.judge },
      experiments: { ...DEFAULTS.experiments },
      fieldVisibility: { ...DEFAULTS.fieldVisibility },
      isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      onboardingComplete: false
    })
    providersStore.init([])
  }

  function completeOnboarding(): void {
    settings.onboardingComplete = true
  }

  return {
    ...toRefs(settings),
    init,
    toggleTheme,
    reset,
    completeOnboarding
  }
})
