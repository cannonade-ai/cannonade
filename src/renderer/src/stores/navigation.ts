import { defineStore } from 'pinia'
import { ref } from 'vue'

export type View = 'models' | 'test-suites' | 'test-runs' | 'settings'

export const useNavigationStore = defineStore('navigation', () => {
  const current = ref<View>('models')

  function navigate(view: View): void {
    current.value = view
  }

  return { current, navigate }
})
