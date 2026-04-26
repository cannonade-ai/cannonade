import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContextMenuStore = defineStore('context-menu', () => {
  const activeId = ref<symbol | null>(null)

  function open(id: symbol): void {
    activeId.value = id
  }

  function close(): void {
    activeId.value = null
  }

  function isOpen(id: symbol): boolean {
    return activeId.value === id
  }

  return { open, close, isOpen }
})
