import { IconCopy, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import type { TestSuite } from '@shared/app/test-suite'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { useConfirmStore } from '@renderer/stores/confirm'

export function useTestCaseMenus(suite: TestSuite): {
  testCaseMenuItems: (id: string) => ContextMenuItem[]
} {
  const store = useTestSuitesStore()
  const confirmStore = useConfirmStore()

  function testCaseMenuItems(id: string): ContextMenuItem[] {
    return [
      {
        label: 'Clone',
        icon: IconCopy,
        action: async () => {
          const tc = suite.testCases.find((c) => c.id === id)
          if (!tc) return
          const clone = { ...tc, id: crypto.randomUUID(), name: `${tc.name} (copy)` }
          const idx = suite.testCases.findIndex((c) => c.id === id)
          suite.testCases.splice(idx + 1, 0, clone)
          await store.save(suite)
        }
      },
      {
        label: 'Delete',
        icon: IconTrash,
        danger: true,
        action: async () => {
          const ok = await confirmStore.confirm({
            title: 'Delete Test Case',
            message:
              'Are you sure you want to delete this test case? This action cannot be undone.',
            confirmText: 'Delete',
            danger: true
          })
          if (!ok) return
          suite.testCases = suite.testCases.filter((tc) => tc.id !== id)
          await store.save(suite)
        }
      }
    ]
  }

  return { testCaseMenuItems }
}
