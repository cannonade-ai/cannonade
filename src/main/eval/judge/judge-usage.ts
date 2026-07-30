import type { JudgeUsage } from '@shared/app/judge'

export function mergeJudgeUsage(usages: JudgeUsage[]): JudgeUsage | undefined {
  if (usages.length === 0) return undefined

  const total = (pick: (usage: JudgeUsage) => number | undefined): number | undefined => {
    const values = usages.flatMap((usage) => {
      const value = pick(usage)
      return value != null ? [value] : []
    })
    return values.length ? values.reduce((a, b) => a + b, 0) : undefined
  }

  return {
    model: usages[0].model,
    inputTokens: total((u) => u.inputTokens),
    outputTokens: total((u) => u.outputTokens),
    totalTokens: total((u) => u.totalTokens),
    cost: total((u) => u.cost)
  }
}
