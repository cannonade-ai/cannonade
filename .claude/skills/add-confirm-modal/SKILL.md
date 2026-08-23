---
name: add-confirm-modal
description: |
  Wires up the existing ConfirmModal to a button or action in this project.
  Use when: adding a confirmation dialog before a destructive action (delete, reset, clear),
  wrapping a button click with a confirm prompt, or connecting any async yes/no gate.
---

# Add Confirm Modal

This project already has a fully working confirm modal system. Do not create a new one — just use it.

## How It Works

**Store:** `src/renderer/src/stores/confirm.ts`  
`confirmStore.confirm(options)` returns a `Promise<boolean>`. It opens the modal; the user's choice resolves the promise.

**Confirm Modal component:** `src/renderer/src/components/ui/ConfirmModal.vue`  
Already mounted globally in `App.vue` — nothing to add to the template.

## Steps to Add a Confirm Gate

### 1. Import and instantiate the store

```ts
import { useConfirmStore } from '@renderer/stores/confirm'
const confirmStore = useConfirmStore()
```

### 2. Replace the direct action call with an async handler

```ts
async function handleDelete(): Promise<void> {
  const ok = await confirmStore.confirm({
    title: 'Delete Item',           // optional, shown as modal heading
    message: 'This cannot be undone.',
    confirmText: 'Delete',          // optional, default is 'Confirm'
    cancelText: 'Cancel',           // optional, default is 'Cancel'
    danger: true                    // optional, styles confirm button as danger
  })
  if (ok) store.deleteItem(id)
}
```

### 3. Point the element at the new handler

```html
<Button type="danger-outline" @click="handleDelete">Delete</Button>
```

## ConfirmOptions Reference

| Field         | Type    | Required | Default     | Notes                          |
|---------------|---------|----------|-------------|--------------------------------|
| `message`     | string  | yes      | —           | Body text of the dialog        |
| `title`       | string  | no       | `'Confirm'` | Heading above the message      |
| `confirmText` | string  | no       | `'Confirm'` | Label on the confirm button    |
| `cancelText`  | string  | no       | `'Cancel'`  | Label on the cancel button     |
| `danger`      | boolean | no       | `false`     | Renders confirm button in red  |

## Rules

- Always `await` the confirm call — never `.then()` chain it.
- The handler must be `async` and return `Promise<void>`.
- Guard the real action inside `if (ok)` — do not call it on cancel.
- Do not pass `danger: true` for non-destructive confirmations.
