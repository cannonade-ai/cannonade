import { defineStore } from 'pinia'
import { nextTick, reactive, toRefs, watch } from 'vue'
import { api } from '../api'
import {
  DEFAULT_APP_SETTINGS as DEFAULTS,
  type AppSettings,
  type FontSize
} from '@shared/app/app-settings'
import { useProvidersStore } from './providers'

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
    api.saveAppSettings({
      ...settings,
      configuredProviders: providersStore.configuredProviders.map((p) => ({ ...p }))
    })
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
      onboardingComplete: loadedSettings.onboardingComplete ?? false
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
