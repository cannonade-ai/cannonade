import { IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useModelsStore } from '@renderer/stores/models'
import { useSettingsStore } from '@renderer/stores/settings'
import { api } from '@renderer/api'
import type { LocalModel } from '@shared/provider/local-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'

export function useModelMenus(): {
  modelMenuItems: (
    model: LocalModel,
    capabilities: ProviderCapabilities | null
  ) => ContextMenuItem[]
} {
  const confirmStore = useConfirmStore()
  const modelsStore = useModelsStore()
  const settingsStore = useSettingsStore()

  function modelMenuItems(
    model: LocalModel,
    capabilities: ProviderCapabilities | null
  ): ContextMenuItem[] {
    const isLoaded = model.loadedInstances.length > 0
    const providerId = model.providerId

    const items: ContextMenuItem[] = []

    if (capabilities?.loadModel) {
      if (!isLoaded) {
        items.push({
          label: 'Load',
          icon: IconPlayerPlay,
          action: async (): Promise<void> => {
            await api.loadModel(providerId, model.id)
            await modelsStore.loadLocalModels()
          }
        })
      }

      if (isLoaded) {
        items.push({
          label: 'Unload',
          icon: IconPlayerStop,
          action: async (): Promise<void> => {
            for (const instance of model.loadedInstances) {
              await api.unloadModel(providerId, instance.id)
            }
            await modelsStore.loadLocalModels()
          }
        })
      }
    }

    const canDelete =
      capabilities?.deleteModel &&
      !(model.providerId === 'lmstudio' && settingsStore.lmStudioRemote)

    if (canDelete) {
      items.push({
        label: 'Delete',
        icon: IconTrash,
        danger: true,
        action: async (): Promise<void> => {
          const ok = await confirmStore.confirm({
            title: 'Delete Model',
            message: `Are you sure you want to delete "${model.name}"? The model files will be permanently removed from disk.`,
            confirmText: 'Delete',
            danger: true
          })
          if (!ok) return
          if (isLoaded) {
            for (const instance of model.loadedInstances) {
              await api.unloadModel(providerId, instance.id)
            }
          }
          await api.deleteModel(providerId, model.id)
          for (let i = 0; i < 10; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            await modelsStore.loadLocalModels()
            if (!modelsStore.localModels.some((m) => m.id === model.id)) break
          }
        }
      })
    }

    return items
  }

  return { modelMenuItems }
}
