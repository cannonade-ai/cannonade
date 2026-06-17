export type SecretSource = 'env' | 'store' | 'none'

export interface SecretInfo {
  source: SecretSource
  preview: string | null
  envName: string
}

export function authHeader(apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}
