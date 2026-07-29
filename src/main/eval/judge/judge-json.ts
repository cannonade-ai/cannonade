export interface JudgeVerdict {
  pass: boolean
  score: number
  reason?: string
}

const TRUTHY = ['true', 'yes', 'pass', 'passed', 'y', '1']
const FALSY = ['false', 'no', 'fail', 'failed', 'n', '0']

export function stripReasoningAndFences(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .replace(/```[a-z]*\s*/gi, '')
    .replace(/```/g, '')
    .trim()
}

export function extractJsonObjects(text: string): string[] {
  const objects: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      if (depth === 0) start = i
      depth++
    } else if (char === '}') {
      if (depth === 0) continue
      depth--
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return objects
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (TRUTHY.includes(normalized)) return true
    if (FALSY.includes(normalized)) return false
  }
  return undefined
}

function coerceScore(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return undefined
  return Math.min(1, Math.max(0, parsed))
}

function coerceReason(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function toVerdict(parsed: Record<string, unknown>): JudgeVerdict | null {
  const pass = coerceBoolean(parsed.pass ?? parsed.passed ?? parsed.result)
  const score = coerceScore(parsed.score ?? parsed.rating)
  const reason = coerceReason(parsed.reason ?? parsed.explanation ?? parsed.rationale)

  if (pass === undefined && score === undefined) return null

  const graded = pass ?? true
  return {
    pass: graded,
    score: score ?? (graded ? 1 : 0),
    reason
  }
}

export function parseJudgeVerdict(text: string): JudgeVerdict | null {
  const cleaned = stripReasoningAndFences(text)

  for (const candidate of extractJsonObjects(cleaned)) {
    let parsed: unknown
    try {
      parsed = JSON.parse(candidate)
    } catch {
      continue
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
    const verdict = toVerdict(parsed as Record<string, unknown>)
    if (verdict) return verdict
  }

  return null
}
