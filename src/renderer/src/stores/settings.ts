import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'

export type FontSize = 'sm' | 'md' | 'lg'

const STORAGE_KEY = 'cannonade:settings'

interface PersistedSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
}

function loadPersisted(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedSettings
  } catch {
    // ignore malformed data
  }
  return {
    isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    fontSize: 'md',
    language: 'en'
  }
}

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadPersisted()

  const isDark = ref(saved.isDark)
  const fontSize = ref<FontSize>(saved.fontSize)
  const language = ref(saved.language)
  const appVersion = ref('')
  const suitesDir = ref('')

  applyTheme(isDark.value)

  watch(isDark, (dark) => applyTheme(dark))

  watch([isDark, fontSize, language], () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isDark: isDark.value,
        fontSize: fontSize.value,
        language: language.value
      })
    )
  })

  async function init(): Promise<void> {
    ;[appVersion.value, suitesDir.value] = await Promise.all([
      api.getAppVersion(),
      api.getSuitesDir()
    ])
  }

  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  return { isDark, fontSize, language, appVersion, suitesDir, init, toggleTheme }
})
