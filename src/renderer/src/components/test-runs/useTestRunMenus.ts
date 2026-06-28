import { IconEdit, IconPlayerStop, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useNavigationStore } from '@renderer/stores/navigation'
import type { TestRun } from '@shared/app/test-run'

const ACTIVE_STATUSES: ReadonlySet<TestRun['status']> = new Set([
  'pending',
  'downloading',
  'running'
])

export function useTestRunMenus(): { runMenuItems: (run: TestRun) => ContextMenuItem[] } {
  const store = useTestRunsStore()
  const confirmStore = useConfirmStore()
  const navigationStore = useNavigationStore()

  function runMenuItems(run: TestRun): ContextMenuItem[] {
    const items: ContextMenuItem[] = []

    items.push({
      label: 'Edit Test Suite',
      icon: IconEdit,
      action: () => {
        navigationStore.openTestSuite(run.config.suiteId)
      }
    })

    if (ACTIVE_STATUSES.has(run.status)) {
      items.push({
        label: 'Stop',
        icon: IconPlayerStop,
        action: () => {
          store.cancelRun(run.id)
        }
      })
    }

    items.push({
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      action: async () => {
        const ok = await confirmStore.confirm({
          title: 'Delete Test Run',
          message: 'Are you sure you want to delete this test run? This action cannot be undone.',
          confirmText: 'Delete',
          danger: true
        })
        if (ok) await store.deleteRun(run.id)
      }
    })

    return items
  }

  return { runMenuItems }
}
