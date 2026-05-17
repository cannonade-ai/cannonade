export type FontSize = 'sm' | 'md' | 'lg'

export const DEFAULT_LM_STUDIO_URL = 'http://localhost:1234'

export interface AppSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
  autoDeleteModels: boolean
  parallelRuns: boolean
  defaultTestTimeout: number
  lmStudioUrl: string
  lmStudioRemote: boolean
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isDark: true,
  fontSize: 'md',
  language: 'en',
  lastSuiteId: null,
  autoDeleteModels: false,
  parallelRuns: false,
  defaultTestTimeout: 42000,
  lmStudioUrl: DEFAULT_LM_STUDIO_URL,
  lmStudioRemote: false
}
