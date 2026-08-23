---
name: add-shortcut
description: |
  Adds a keyboard shortcut to a component using this project's useShortcut composable.
  Use when: wiring a key (Escape, F5, Ctrl+S, etc.) to an action; adding a hotkey to
  close a modal, refresh a view, trigger a button, or any key-to-handler binding.
---

# Add Shortcut

Use the `useShortcut` composable (`src/renderer/src/composables/useShortcut.ts`) — don't hand-roll
`window.addEventListener('keydown', ...)`. It handles mount/unmount for you.

```ts
import { useShortcut } from '@renderer/composables/useShortcut'

useShortcut('Escape', () => emit('back'))
useShortcut('F5', () => store.refresh(), { preventDefault: true })
useShortcut('Ctrl+Delete', () => onDelete(), { preventDefault: true })
useShortcut(['Enter', 'Ctrl+Enter'], () => confirm())
```

`useShortcut(key, handler, options?)` — `key` is a case-insensitive combo string (a
`KeyboardEvent.key` optionally prefixed with `Ctrl+` / `Meta+` (`Cmd`, `Command`, `Super`, `Win`) /
`Shift+` / `Alt+` (`Option`)), or an array of them for alternatives. The handler receives the
`KeyboardEvent`. Options (all default `false`): `ctrl`, `meta`, `shift`, `alt`, `preventDefault` —
the modifier options set the default for every combo, and modifiers must match exactly.

- Only use `preventDefault` for keys with a native action to block (F5, Ctrl+S, Ctrl+P).
- Guard inside the handler for state-dependent shortcuts (`if (props.modelValue) close()`).
