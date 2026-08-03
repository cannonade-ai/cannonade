import type { ConfiguredProvider } from '../provider/configured-provider'
import type { LogLevel } from './logging'
import { DEFAULT_JUDGE_SETTINGS, type JudgeSettings } from './judge'
import { DEFAULT_EXPERIMENT_SETTINGS, type ExperimentSettings } from './experiments'

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
  logLevel: LogLevel
  judge: JudgeSettings
  experiments: ExperimentSettings
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
  onboardingComplete: false,
  logLevel: 'info',
  judge: { ...DEFAULT_JUDGE_SETTINGS },
  experiments: { ...DEFAULT_EXPERIMENT_SETTINGS }
}
