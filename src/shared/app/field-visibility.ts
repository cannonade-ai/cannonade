export interface FieldVisibility {
  systemPrompt: boolean
  input: boolean
  thinking: boolean
  output: boolean
  evaluations: boolean
  metrics: boolean
}

export const DEFAULT_FIELD_VISIBILITY: FieldVisibility = {
  systemPrompt: true,
  input: true,
  thinking: true,
  output: true,
  evaluations: true,
  metrics: true
}

export const FIELD_VISIBILITY_LABELS: Record<keyof FieldVisibility, string> = {
  systemPrompt: 'System Prompt',
  input: 'Input',
  thinking: 'Thinking',
  output: 'Actual Output',
  evaluations: 'Evaluation',
  metrics: 'Metrics'
}
