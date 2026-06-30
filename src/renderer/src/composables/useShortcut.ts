import { onMounted, onUnmounted } from 'vue'

export interface ShortcutOptions {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  preventDefault?: boolean
}

type ModifierName = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ParsedShortcut {
  key: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  alt: boolean
}

const MODIFIER_ALIASES: Record<string, ModifierName> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta',
  shift: 'shift',
  alt: 'alt',
  option: 'alt'
}

function parseShortcut(combo: string, defaults: Omit<ParsedShortcut, 'key'>): ParsedShortcut {
  const parts = combo
    .split('+')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)

  const result: ParsedShortcut = { key: '', ...defaults }
  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part]
    if (modifier) result[modifier] = true
    else result.key = part
  }
  return result
}

export function useShortcut(
  key: string | string[],
  handler: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
): void {
  const { ctrl = false, meta = false, shift = false, alt = false, preventDefault = false } = options
  const shortcuts = (Array.isArray(key) ? key : [key]).map((k) =>
    parseShortcut(k, { ctrl, meta, shift, alt })
  )

  function onKeyDown(e: KeyboardEvent): void {
    const pressed = e.key.toLowerCase()
    const match = shortcuts.some(
      (s) =>
        s.key === pressed &&
        s.ctrl === e.ctrlKey &&
        s.meta === e.metaKey &&
        s.shift === e.shiftKey &&
        s.alt === e.altKey
    )
    if (!match) return

    if (preventDefault) e.preventDefault()
    handler(e)
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
