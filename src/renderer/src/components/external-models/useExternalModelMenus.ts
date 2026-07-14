import { IconMessageCircle, IconTestPipe } from '@tabler/icons-vue'
import type { ContextMenuItem } from '@renderer/stores/context-menu'
import { useNavigationStore } from '@renderer/stores/navigation'
import { supportsTextOutput } from '@shared/provider/external-model'
import type { ExternalModel } from '@shared/provider/external-model'

export function useExternalModelMenus(): {
  externalModelMenuItems: (model: ExternalModel) => ContextMenuItem[]
} {
  const navigationStore = useNavigationStore()

  function externalModelMenuItems(model: ExternalModel): ContextMenuItem[] {
    if (!supportsTextOutput(model)) return []
    return [
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
    ]
  }

  return { externalModelMenuItems }
}
