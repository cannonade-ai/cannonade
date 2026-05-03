import type { Provider, ProviderModelMap } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import { toRaw } from 'vue'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { AppSettings } from '@shared/app/app-settings'

export const api = {
  fetchModels: <P extends Provider>(provider: P): Promise<ProviderModelMap[P][]> =>
    window.api.fetchModels(provider),
  lmStudioChat: (request: ChatRequest, apiToken?: string): Promise<ChatResponse> =>
    window.api.lmStudioChat(request, apiToken),
  lmStudioLoadModel: (modelKey: string): Promise<void> => window.api.lmStudioLoadModel(modelKey),
  lmStudioUnloadModel: (instanceId: string): Promise<void> =>
    window.api.lmStudioUnloadModel(instanceId),
  lmStudioDeleteModel: (model: Model): Promise<void> =>
    window.api.lmStudioDeleteModel(toRaw(model)),
  getAppVersion: (): Promise<string> => window.api.getAppVersion(),
  getSuitesDir: (): Promise<string> => window.api.getSuitesDir(),
  minimize: (): void => window.api.minimize(),
  maximize: (): void => window.api.maximize(),
  close: (): void => window.api.close(),
  listSuites: (): Promise<TestSuite[]> => window.api.listSuites(),
  saveSuite: (suite: TestSuite): Promise<void> => window.api.saveSuite(suite),
  deleteSuite: (id: string): Promise<void> => window.api.deleteSuite(id),
  loadAppSettings: (): Promise<AppSettings> => window.api.loadAppSettings(),
  saveAppSettings: (settings: AppSettings): Promise<void> => window.api.saveAppSettings(settings)
}
