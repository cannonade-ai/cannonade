import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'
import { DEFAULT_LM_STUDIO_PORT } from '@shared/app/app-settings'

export type FontSize = 'sm' | 'md' | 'lg'

const STORAGE_KEY = 'cannonade:settings'

interface PersistedSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
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
    language: 'en',
    lastSuiteId: null
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
  const lastSuiteId = ref<string | null>(saved.lastSuiteId)
  const lmStudioPort = ref<number>(DEFAULT_LM_STUDIO_PORT)
  const appVersion = ref('')
  const suitesDir = ref('')

  applyTheme(isDark.value)

  watch(isDark, (dark) => applyTheme(dark))

  watch([isDark, fontSize, language, lastSuiteId], () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isDark: isDark.value,
        fontSize: fontSize.value,
        language: language.value,
        lastSuiteId: lastSuiteId.value
      })
    )
  })

  watch(lmStudioPort, (port) => {
    api.saveAppSettings({ lmStudioPort: port })
  })

  async function init(): Promise<void> {
    const [version, dir, appSettings] = await Promise.all([
      api.getAppVersion(),
      api.getSuitesDir(),
      api.loadAppSettings()
    ])
    appVersion.value = version
    suitesDir.value = dir
    lmStudioPort.value = appSettings.lmStudioPort
  }

  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    fontSize,
    language,
    lastSuiteId,
    lmStudioPort,
    appVersion,
    suitesDir,
    init,
    toggleTheme
  }
})
