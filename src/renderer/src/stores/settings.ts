import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '../api'
import { DEFAULT_LM_STUDIO_PORT } from '@shared/app/app-settings'

export type FontSize = 'sm' | 'md' | 'lg'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const STORAGE_KEY = 'cannonade:settings'

const DEFAULTS = {
  fontSize: 'md' as FontSize,
  language: 'en',
  lastSuiteId: null as string | null,
  autoDeleteModels: false,
  parallelRuns: false,
  defaultTestTimeout: 60000
}

interface PersistedSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
  autoDeleteModels: boolean
  parallelRuns: boolean
  defaultTestTimeout: number
}

function loadPersisted(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedSettings>
      return {
        isDark: parsed.isDark ?? window.matchMedia('(prefers-color-scheme: dark)').matches,
        fontSize: parsed.fontSize ?? DEFAULTS.fontSize,
        language: parsed.language ?? DEFAULTS.language,
        lastSuiteId: parsed.lastSuiteId ?? DEFAULTS.lastSuiteId,
        autoDeleteModels: parsed.autoDeleteModels ?? DEFAULTS.autoDeleteModels,
        parallelRuns: parsed.parallelRuns ?? DEFAULTS.parallelRuns,
        defaultTestTimeout: parsed.defaultTestTimeout ?? DEFAULTS.defaultTestTimeout
      }
    }
  } catch {
    // ignore malformed data
  }
  return {
    isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    ...DEFAULTS
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
  const autoDeleteModels = ref(saved.autoDeleteModels)
  const parallelRuns = ref(saved.parallelRuns)
  const defaultTestTimeout = ref(saved.defaultTestTimeout)
  const lmStudioPort = ref<number>(DEFAULT_LM_STUDIO_PORT)
  const appVersion = ref('')
  const suitesDir = ref('')

  applyTheme(isDark.value)

  watch(isDark, (dark) => applyTheme(dark))

  watch(
    [isDark, fontSize, language, lastSuiteId, autoDeleteModels, parallelRuns, defaultTestTimeout],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isDark: isDark.value,
          fontSize: fontSize.value,
          language: language.value,
          lastSuiteId: lastSuiteId.value,
          autoDeleteModels: autoDeleteModels.value,
          parallelRuns: parallelRuns.value,
          defaultTestTimeout: defaultTestTimeout.value
        })
      )
    }
  )

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

  function reset(): void {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    fontSize.value = DEFAULTS.fontSize
    language.value = DEFAULTS.language
    autoDeleteModels.value = DEFAULTS.autoDeleteModels
    parallelRuns.value = DEFAULTS.parallelRuns
    defaultTestTimeout.value = DEFAULTS.defaultTestTimeout
    lmStudioPort.value = DEFAULT_LM_STUDIO_PORT
    api.saveAppSettings({ lmStudioPort: DEFAULT_LM_STUDIO_PORT })
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    isDark,
    fontSize,
    language,
    lastSuiteId,
    autoDeleteModels,
    parallelRuns,
    defaultTestTimeout,
    lmStudioPort,
    appVersion,
    suitesDir,
    init,
    toggleTheme,
    reset
  }
})
