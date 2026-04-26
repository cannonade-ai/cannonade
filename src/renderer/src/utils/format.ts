export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

export function formatPrice(raw: string): string {
  const n = parseFloat(raw)
  if (n === 0) return 'free'
  const perMillion = n * 1_000_000
  return `$${perMillion % 1 === 0 ? perMillion.toFixed(0) : perMillion.toPrecision(3)}/M`
}

export function formatDate(iso: string | undefined, showSeconds: boolean = false): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: false
  })
}
