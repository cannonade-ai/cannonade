export interface JudgeSettings {
  providerInstanceId: string
  modelId: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
}

export const DEFAULT_JUDGE_SETTINGS: JudgeSettings = {
  providerInstanceId: '',
  modelId: '',
  temperature: undefined,
  maxOutputTokens: 1000,
  timeoutMs: 120000
}

export interface JudgeUsage {
  model: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  cost?: number
}
