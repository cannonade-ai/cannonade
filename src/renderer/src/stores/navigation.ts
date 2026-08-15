import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createLogger } from '@renderer/utils/logger'

const log = createLogger('navigation-store')

export type View =
  | 'local-models'
  | 'external-models'
  | 'test-suites'
  | 'test-runs'
  | 'prompts'
  | 'playground'
  | 'logs'
export type SettingsSection =
  | 'general'
  | 'providers'
  | 'appearance'
  | 'test-runs'
  | 'output'
  | 'experiments'

export interface NavigationPayload {
  promptId?: string
  suiteId?: string
  providerId?: string
  modelId?: string
}

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('local-models')
  const payload = ref<NavigationPayload | null>(null)
  const settingsOpen = ref(false)
  const settingsSection = ref<SettingsSection>('general')

  function navigate(view: View, data?: NavigationPayload): void {
    log.debug(`navigating to ${view} with payload: ${data ?? null}`)
    payload.value = data ?? null
    current.value = view
  }

  function consumePayload(): NavigationPayload | null {
    const data = payload.value
    payload.value = null
    return data
  }

  function openSettings(section: SettingsSection = 'general'): void {
    settingsSection.value = section
    settingsOpen.value = true
  }

  function closeSettings(): void {
    settingsOpen.value = false
  }

  return {
    current,
    navigate,
    consumePayload,
    settingsOpen,
    settingsSection,
    openSettings,
    closeSettings
  }
})
