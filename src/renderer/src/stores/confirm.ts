import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export const useConfirmStore = defineStore('confirm', () => {
  const current = ref<ConfirmState | null>(null)

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      current.value = { ...options, resolve }
    })
  }

  function respond(value: boolean): void {
    current.value?.resolve(value)
    current.value = null
  }

  return { current, confirm, respond }
})
