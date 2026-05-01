import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Component } from 'vue'

export interface ContextMenuItem {
  label: string
  icon?: Component
  danger?: boolean
  action: () => void
}

interface ContextMenuState {
  items: ContextMenuItem[]
  position: { top: number; left?: number; right?: number }
}

const DROPDOWN_HEIGHT = 80

export const useContextMenuStore = defineStore('context-menu', () => {
  const current = ref<ContextMenuState | null>(null)

  function open(items: ContextMenuItem[], event: MouseEvent): void {
    event.stopPropagation()
    const spaceBelow = window.innerHeight - event.clientY
    const top =
      spaceBelow >= DROPDOWN_HEIGHT ? event.clientY + 4 : event.clientY - DROPDOWN_HEIGHT - 4
    current.value = { items, position: { top, left: event.clientX } }
  }

  function openAt(items: ContextMenuItem[], el: Element): void {
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= DROPDOWN_HEIGHT ? rect.bottom + 4 : rect.top - DROPDOWN_HEIGHT - 4
    current.value = { items, position: { top, right: window.innerWidth - rect.right } }
  }

  function close(): void {
    current.value = null
  }

  return { current, open, openAt, close }
})
