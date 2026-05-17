import { defineStore } from 'pinia'
import { ref } from 'vue'

export type View = 'local-models' | 'test-suites' | 'test-runs'
export type SettingsSection = 'general' | 'providers' | 'appearance' | 'test-runs'

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('local-models')
  const settingsOpen = ref(false)
  const settingsSection = ref<SettingsSection>('general')

  function navigate(view: View): void {
    current.value = view
  }

  function openSettings(section: SettingsSection = 'general'): void {
    settingsSection.value = section
    settingsOpen.value = true
  }

  function closeSettings(): void {
    settingsOpen.value = false
  }

  return { current, navigate, settingsOpen, settingsSection, openSettings, closeSettings }
})
