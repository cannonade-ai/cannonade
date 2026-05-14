import { defineStore } from 'pinia'
import { ref } from 'vue'

export type View = 'local-models' | 'test-suites' | 'test-runs'

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('local-models')
  const settingsOpen = ref(false)

  function navigate(view: View): void {
    current.value = view
  }

  function openSettings(): void {
    settingsOpen.value = true
  }

  function closeSettings(): void {
    settingsOpen.value = false
  }

  return { current, navigate, settingsOpen, openSettings, closeSettings }
})
