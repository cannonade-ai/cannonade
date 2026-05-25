import type { ConfiguredProvider } from '../provider/configured-provider'

export type FontSize = 'sm' | 'md' | 'lg'

export interface AppSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
  autoDeleteModels: boolean
  parallelRuns: boolean
  defaultTestTimeout: number
  configuredProviders: ConfiguredProvider[]
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isDark: true,
  fontSize: 'md',
  language: 'en',
  lastSuiteId: null,
  autoDeleteModels: false,
  parallelRuns: false,
  defaultTestTimeout: 42000,
  configuredProviders: []
}
