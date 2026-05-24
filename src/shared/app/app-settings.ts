import type { ProviderId } from '../provider/ids'

export type FontSize = 'sm' | 'md' | 'lg'

export const DEFAULT_LM_STUDIO_URL = 'http://localhost:1234'
export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'

export interface AppSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
  lastProvider: ProviderId
  autoDeleteModels: boolean
  parallelRuns: boolean
  defaultTestTimeout: number
  lmStudioUrl: string
  lmStudioRemote: boolean
  ollamaUrl: string
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isDark: true,
  fontSize: 'md',
  language: 'en',
  lastSuiteId: null,
  lastProvider: 'lmstudio',
  autoDeleteModels: false,
  parallelRuns: false,
  defaultTestTimeout: 42000,
  lmStudioUrl: DEFAULT_LM_STUDIO_URL,
  lmStudioRemote: false,
  ollamaUrl: DEFAULT_OLLAMA_URL
}
