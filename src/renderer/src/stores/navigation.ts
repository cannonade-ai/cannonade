import { defineStore } from 'pinia'
import { ref } from 'vue'

export type View = 'local-models' | 'test-suites' | 'test-runs' | 'prompts' | 'playground'
export type SettingsSection = 'general' | 'providers' | 'appearance' | 'test-runs'

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('local-models')
  const settingsOpen = ref(false)
  const settingsSection = ref<SettingsSection>('general')
  const pendingSuiteId = ref<string | null>(null)
  const pendingPlaygroundPromptId = ref<string | null>(null)

  function navigate(view: View): void {
    current.value = view
  }

  function openTestSuite(id: string): void {
    pendingSuiteId.value = id
    current.value = 'test-suites'
  }

  function getPendingSuiteId(): string | null {
    const id = pendingSuiteId.value
    pendingSuiteId.value = null
    return id
  }

  function openInPlayground(promptId: string): void {
    pendingPlaygroundPromptId.value = promptId
    current.value = 'playground'
  }

  function getPendingPlaygroundPromptId(): string | null {
    const id = pendingPlaygroundPromptId.value
    pendingPlaygroundPromptId.value = null
    return id
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
    openTestSuite,
    consumePendingSuiteId: getPendingSuiteId,
    openInPlayground,
    consumePendingPlaygroundPromptId: getPendingPlaygroundPromptId,
    settingsOpen,
    settingsSection,
    openSettings,
    closeSettings
  }
})
