import { app, safeStorage } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { SecretInfo } from '@shared/provider/api-key'

export type { SecretInfo }

let cache: Record<string, string> = {}

function credentialsPath(): string {
  return join(app.getPath('userData'), 'credentials.json')
}

function maskSecret(value: string): string {
  const visible = value.slice(-4)
  return `${'•'.repeat(5)}${value.length > 4 ? visible : ''}`
}

export async function initSecrets(): Promise<void> {
  cache = {}
  if (!safeStorage.isEncryptionAvailable()) return
  try {
    const raw = await fs.readFile(credentialsPath(), 'utf-8')
    const stored = JSON.parse(raw) as Record<string, string>
    for (const [key, encoded] of Object.entries(stored)) {
      try {
        cache[key] = safeStorage.decryptString(Buffer.from(encoded, 'base64'))
      } catch (e) {
        console.error(`[secrets] failed to decrypt ${key}`, e)
      }
    }
  } catch {
    cache = {}
  }
}

async function persist(): Promise<void> {
  const encoded: Record<string, string> = {}
  for (const [key, value] of Object.entries(cache)) {
    encoded[key] = safeStorage.encryptString(value).toString('base64')
  }
  await fs.writeFile(credentialsPath(), JSON.stringify(encoded, null, 2), 'utf-8')
}

export function getSecret(envNames: readonly string[]): string | undefined {
  for (const name of envNames) {
    const fromEnv = process.env[name]
    if (fromEnv) return fromEnv
  }
  return cache[envNames[0]]
}

export function getSecretInfo(envNames: readonly string[]): SecretInfo {
  const canonical = envNames[0]
  for (const name of envNames) {
    const fromEnv = process.env[name]
    if (fromEnv) return { source: 'env', preview: maskSecret(fromEnv), envName: name }
  }
  const stored = cache[canonical]
  if (stored) return { source: 'store', preview: maskSecret(stored), envName: canonical }
  return { source: 'none', preview: null, envName: canonical }
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is not available on this system')
  }
  cache[key] = value
  await persist()
}

export async function deleteSecret(key: string): Promise<void> {
  delete cache[key]
  await persist()
}

export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
