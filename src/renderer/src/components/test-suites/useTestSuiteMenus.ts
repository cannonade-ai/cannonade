import { IconCopy, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { useConfirmStore } from '@renderer/stores/confirm'

export function useTestSuiteMenus(): { suiteMenuItems: (id: string) => ContextMenuItem[] } {
  const store = useTestSuitesStore()
  const confirmStore = useConfirmStore()

  function suiteMenuItems(id: string): ContextMenuItem[] {
    return [
      {
        label: 'Clone',
        icon: IconCopy,
        action: async () => {
          const clone = store.clone(id)
          if (clone) await store.save(clone)
        }
      },
      {
        label: 'Delete',
        icon: IconTrash,
        danger: true,
        action: async () => {
          const ok = await confirmStore.confirm({
            title: 'Delete Test Suite',
            message:
              'Are you sure you want to delete this test suite? This action cannot be undone.',
            confirmText: 'Delete',
            danger: true
          })
          if (ok) await store.remove(id)
        }
      }
    ]
  }

  return { suiteMenuItems }
}
