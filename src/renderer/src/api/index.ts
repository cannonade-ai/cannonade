import type { Provider, ProviderModelMap } from '@shared/provider-model-map'

export const api = {
  fetchModels: <P extends Provider>(provider: P): Promise<ProviderModelMap[P][]> =>
    window.api.fetchModels(provider),
  getAppVersion: (): Promise<string> => window.api.getAppVersion(),
  minimize: (): void => window.api.minimize(),
  maximize: (): void => window.api.maximize(),
  close: (): void => window.api.close()
}
