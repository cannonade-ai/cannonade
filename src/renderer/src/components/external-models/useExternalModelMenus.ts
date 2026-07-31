import { IconBraces, IconMessageCircle, IconTestPipe } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useNavigationStore } from '@renderer/stores/navigation'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import { supportsTextOutput } from '@shared/provider/external-model'
import type { ExternalModel } from '@shared/provider/external-model'

export function useExternalModelMenus(): {
  externalModelMenuItems: (model: ExternalModel) => ContextMenuItem[]
} {
  const navigationStore = useNavigationStore()
  const viewStore = useExternalModelsViewStore()

  function externalModelMenuItems(model: ExternalModel): ContextMenuItem[] {
    const items: ContextMenuItem[] = []

    if (supportsTextOutput(model)) {
      items.push(
        {
          label: 'Open in Playground',
          icon: IconMessageCircle,
          action: (): void => {
            navigationStore.navigate('playground', {
              providerId: model.providerId,
              modelId: model.id
            })
          }
        },
        {
          label: 'New Test Run',
          icon: IconTestPipe,
          action: (): void => {
            navigationStore.navigate('test-runs', {
              providerId: model.providerId,
              modelId: model.id
            })
          }
        }
      )
    }

    if (model.raw) {
      items.push({
        label: 'View Raw JSON',
        icon: IconBraces,
        action: (): void => {
          viewStore.rawJsonModel = model
        }
      })
    }

    return items
  }

  return { externalModelMenuItems }
}
