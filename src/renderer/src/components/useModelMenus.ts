import {
  IconMessageCircle,
  IconPlayerPlay,
  IconPlayerStop,
  IconTestPipe,
  IconTrash
} from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useModelsStore } from '@renderer/stores/models'
import { useNavigationStore } from '@renderer/stores/navigation'
import { useToastStore } from '@renderer/stores/toast'

import { api } from '@renderer/api'
import type { LocalModel } from '@shared/provider/local-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import { createLogger } from '@renderer/utils/logger'

const log = createLogger('model-menus')

export function useModelMenus(): {
  modelMenuItems: (
    model: LocalModel,
    capabilities: ProviderCapabilities | null
  ) => ContextMenuItem[]
} {
  const confirmStore = useConfirmStore()
  const modelsStore = useModelsStore()
  const navigationStore = useNavigationStore()
  const toastStore = useToastStore()

  function modelMenuItems(
    model: LocalModel,
    capabilities: ProviderCapabilities | null
  ): ContextMenuItem[] {
    const isLoaded = model.loadedInstances.length > 0
    const providerId = model.providerId

    const items: ContextMenuItem[] = []

    if (model.type === 'llm') {
      items.push(
        {
          label: 'Open in Playground',
          icon: IconMessageCircle,
          action: (): void => {
            navigationStore.navigate('playground', { providerId, modelId: model.id })
          }
        },
        {
          label: 'New Test Run',
          icon: IconTestPipe,
          action: (): void => {
            navigationStore.navigate('test-runs', { providerId, modelId: model.id })
          }
        }
      )
    }

    if (capabilities?.loadModel) {
      if (!isLoaded) {
        items.push({
          label: 'Load',
          icon: IconPlayerPlay,
          action: async (): Promise<void> => {
            modelsStore.setModelOperation(model.id, 'loading')
            try {
              await api.loadModel(providerId, model.id)
              await modelsStore.loadLocalModels()
              toastStore.success(`${model.name} loaded successfully.`)
              log.info(`${model.name} loaded successfully.`)
            } catch (e) {
              const message = `Failed to load ${model.name}. ${e instanceof Error ? e.message : ''}`
              toastStore.error(message, { title: 'Model load failed', duration: 0 })
              log.error(message)
            } finally {
              modelsStore.setModelOperation(model.id, null)
            }
          }
        })
      }

      if (isLoaded) {
        items.push({
          label: 'Unload',
          icon: IconPlayerStop,
          action: async (): Promise<void> => {
            modelsStore.setModelOperation(model.id, 'unloading')
            try {
              for (const instance of model.loadedInstances) {
                await api.unloadModel(providerId, instance.id)
              }
              log.info(`${model.name} unloaded successfully.`)
              await modelsStore.loadLocalModels()
            } finally {
              modelsStore.setModelOperation(model.id, null)
            }
          }
        })
      }
    }

    const canDelete = capabilities?.deleteModel

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
          modelsStore.setModelOperation(model.id, 'deleting')
          try {
            if (isLoaded) {
              for (const instance of model.loadedInstances) {
                await api.unloadModel(providerId, instance.id)
              }
            }
            try {
              await api.deleteModel(providerId, model.id)
              toastStore.success(`${model.name} deleted successfully.`)
              log.info(`${model.name} deleted successfully.`)
            } catch (e) {
              log.error(`${model.name} Failed to delete model.`, e)
              toastStore.error(`${model.name} Failed to delete model. ${e}`)
              return
            }
            for (let i = 0; i < 10; i++) {
              await new Promise((resolve) => setTimeout(resolve, 500))
              await modelsStore.loadLocalModels()
              if (!modelsStore.localModels.some((m) => m.id === model.id)) break
            }
          } finally {
            modelsStore.setModelOperation(model.id, null)
          }
        }
      })
    }

    return items
  }

  return { modelMenuItems }
}
