import type { EvaluationConfig } from '@shared/app/test-suite'

const HUE_FAIL_LOW = 25
const HUE_FAIL_HIGH = 50
const HUE_PASS_LOW = 132
const HUE_PASS_HIGH = 158

export const DEFAULT_THRESHOLD = 0.9

export function scoreThreshold(
  evaluations: EvaluationConfig[],
  passingLogic: 'all' | 'any'
): number {
  if (evaluations.length === 0) return DEFAULT_THRESHOLD
  const thresholds = evaluations.map((ev) => ev.threshold ?? DEFAULT_THRESHOLD)
  if (passingLogic === 'any') return Math.min(...thresholds) / thresholds.length
  return thresholds.reduce((sum, t) => sum + t, 0) / thresholds.length
}

export function scoreHue(score: number, threshold: number): number {
  const pivot = clamp(threshold, 0.05, 0.95)
  const value = clamp(score, 0, 1)

  if (value >= pivot) {
    const t = (value - pivot) / (1 - pivot)
    return HUE_PASS_LOW + t * (HUE_PASS_HIGH - HUE_PASS_LOW)
  }

  const t = value / pivot
  return HUE_FAIL_LOW + t * (HUE_FAIL_HIGH - HUE_FAIL_LOW)
}

export function scoreColorStyle(
  score: number | null | undefined,
  threshold: number
): Record<string, string> {
  if (score == null) return {}
  return { '--score-h': scoreHue(score, threshold).toFixed(1) }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
