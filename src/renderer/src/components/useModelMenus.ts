import { IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useModelsStore } from '@renderer/stores/models'
import { api } from '@renderer/api'
import type { Model } from '@shared/lm-studio/ipc-contracts'

export function useModelMenus(): { modelMenuItems: (model: Model) => ContextMenuItem[] } {
  const confirmStore = useConfirmStore()
  const modelsStore = useModelsStore()

  function modelMenuItems(model: Model): ContextMenuItem[] {
    const isLoaded = model.loaded_instances.length > 0

    const items: ContextMenuItem[] = []

    if (!isLoaded) {
      items.push({
        label: 'Load',
        icon: IconPlayerPlay,
        action: async (): Promise<void> => {
          await api.lmStudioLoadModel(model.key)
          await modelsStore.load()
        }
      })
    }

    if (isLoaded) {
      items.push({
        label: 'Unload',
        icon: IconPlayerStop,
        action: async (): Promise<void> => {
          for (const instance of model.loaded_instances) {
            await api.lmStudioUnloadModel(instance.id)
          }
          await modelsStore.load()
        }
      })
    }

    items.push({
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      action: async (): Promise<void> => {
        const ok = await confirmStore.confirm({
          title: 'Delete Model',
          message: `Are you sure you want to delete "${model.display_name}"? The model files will be permanently removed from disk.`,
          confirmText: 'Delete',
          danger: true
        })
        if (!ok) return
        if (isLoaded) {
          for (const instance of model.loaded_instances) {
            await api.lmStudioUnloadModel(instance.id)
          }
        }
        await api.lmStudioDeleteModel(model)
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await modelsStore.load()
          if (!modelsStore.lmModels.some((m) => m.key === model.key)) break
        }
      }
    })

    return items
  }

  return { modelMenuItems }
}
