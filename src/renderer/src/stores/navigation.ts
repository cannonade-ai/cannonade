import { defineStore } from 'pinia'
import { ref } from 'vue'

export type View = 'local-models' | 'test-suites' | 'test-runs' | 'settings'

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('local-models')

  function navigate(view: View): void {
    current.value = view
  }

  return { current, navigate }
})
