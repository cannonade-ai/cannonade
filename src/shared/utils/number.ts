export function perTokenToPerMillion(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n)) return undefined
  return Number((n * 1_000_000).toPrecision(12))
}
