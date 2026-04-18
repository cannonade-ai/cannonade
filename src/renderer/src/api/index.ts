import type { Provider, ProviderModelMap } from '@shared/provider-model-map'
import type { TestSuite } from '@shared/app/test-suite'

export const api = {
  fetchModels: <P extends Provider>(provider: P): Promise<ProviderModelMap[P][]> =>
    window.api.fetchModels(provider),
  getAppVersion: (): Promise<string> => window.api.getAppVersion(),
  getSuitesDir: (): Promise<string> => window.api.getSuitesDir(),
  minimize: (): void => window.api.minimize(),
  maximize: (): void => window.api.maximize(),
  close: (): void => window.api.close(),
  listSuites: (): Promise<TestSuite[]> => window.api.listSuites(),
  saveSuite: (suite: TestSuite): Promise<void> => window.api.saveSuite(suite),
  deleteSuite: (id: string): Promise<void> => window.api.deleteSuite(id)
}
