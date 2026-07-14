import { IconCopy, IconMessageCircle, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { usePromptsStore } from '@renderer/stores/prompts'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useNavigationStore } from '@renderer/stores/navigation'

export function usePromptMenus(): { promptMenuItems: (id: string) => ContextMenuItem[] } {
  const store = usePromptsStore()
  const confirmStore = useConfirmStore()
  const navigationStore = useNavigationStore()

  function promptMenuItems(id: string): ContextMenuItem[] {
    return [
      {
        label: 'Open in Playground',
        icon: IconMessageCircle,
        action: () => {
          navigationStore.navigate('playground', { promptId: id })
        }
      },
      {
        label: 'Clone',
        icon: IconCopy,
        action: async () => {
          await store.clone(id)
        }
      },
      {
        label: 'Delete',
        icon: IconTrash,
        danger: true,
        action: async () => {
          const ok = await confirmStore.confirm({
            title: 'Delete Prompt',
            message:
              'Are you sure you want to delete this prompt and all of its versions? This action cannot be undone.',
            confirmText: 'Delete',
            danger: true
          })
          if (ok) await store.remove(id)
        }
      }
    ]
  }

  return { promptMenuItems }
}
