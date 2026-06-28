import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  message: string
  title?: string
  type?: ToastType
  duration?: number
}

export interface Toast extends Required<Omit<ToastOptions, 'title'>> {
  id: number
  title?: string
}

const DEFAULT_DURATION = 5000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function show(options: ToastOptions): number {
    const id = nextId++
    toasts.value.push({
      id,
      type: options.type ?? 'default',
      duration: options.duration ?? DEFAULT_DURATION,
      message: options.message,
      title: options.title
    })
    return id
  }

  function success(message: string, options: Omit<ToastOptions, 'message' | 'type'> = {}): number {
    return show({ ...options, message, type: 'success' })
  }

  function error(message: string, options: Omit<ToastOptions, 'message' | 'type'> = {}): number {
    return show({ ...options, message, type: 'error' })
  }

  function info(message: string, options: Omit<ToastOptions, 'message' | 'type'> = {}): number {
    return show({ ...options, message, type: 'info' })
  }

  function warning(message: string, options: Omit<ToastOptions, 'message' | 'type'> = {}): number {
    return show({ ...options, message, type: 'warning' })
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return { toasts, show, success, error, info, warning, dismiss }
})
