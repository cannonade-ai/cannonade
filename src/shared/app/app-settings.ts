import type { ConfiguredProvider } from '../provider/configured-provider'

export type FontSize = 'sm' | 'md' | 'lg'

export interface AppSettings {
  isDark: boolean
  fontSize: FontSize
  language: string
  lastSuiteId: string | null
  autoDeleteModels: boolean
  parallelRuns: boolean
  unloadModelsBeforeRun: boolean
  unloadModelsAfterRun: boolean
  defaultTestCaseTimeout: number
  configuredProviders: ConfiguredProvider[]
  onboardingComplete: boolean
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isDark: true,
  fontSize: 'md',
  language: 'en',
  lastSuiteId: null,
  autoDeleteModels: false,
  parallelRuns: false,
  unloadModelsBeforeRun: true,
  unloadModelsAfterRun: false,
  defaultTestCaseTimeout: 0,
  configuredProviders: [],
  onboardingComplete: false
}
