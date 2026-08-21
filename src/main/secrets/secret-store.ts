import { app, safeStorage } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import writeFileAtomic from 'write-file-atomic'
import type { ProbeAuth, SecretInfo } from '@shared/provider/api-key'
import type { ConfiguredProvider, ProviderType } from '@shared/provider/configured-provider'
import {
  resolveApiKey as resolveApiKeyFromSources,
  resolveProbeApiKey,
  type SecretSources
} from './auth-resolution'
import { resolvedEnvironment } from '../services/executable-path'
import { createLogger } from '../logger'

export type { SecretInfo }

const log = createLogger('secret-store')

let cache: Record<string, string> = {}

function credentialsPath(): string {
  return join(app.getPath('userData'), 'credentials.json')
}

function maskSecret(value: string): string {
  const visible = value.slice(-4)
  return `${'•'.repeat(5)}${value.length > 4 ? visible : ''}`
}

function sources(): SecretSources {
  return { env: resolvedEnvironment(), store: cache }
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
        log.error(`Failed to decrypt ${key}:`, e)
      }
    }
  } catch (err) {
    log.debug('No stored credentials loaded:', err)
    cache = {}
  }
}

async function persist(): Promise<void> {
  const encoded: Record<string, string> = {}
  for (const [key, value] of Object.entries(cache)) {
    encoded[key] = safeStorage.encryptString(value).toString('base64')
  }
  await writeFileAtomic(credentialsPath(), JSON.stringify(encoded, null, 2))
}

export function resolveApiKey(provider: ConfiguredProvider): string | undefined {
  return resolveApiKeyFromSources(provider, sources())
}

export function resolveProbeKey(type: ProviderType, auth?: ProbeAuth): string | undefined {
  return resolveProbeApiKey(type, auth, sources())
}

export function getSecretInfo(envVarName: string, instanceId: string | null): SecretInfo {
  const fromEnv = resolvedEnvironment()[envVarName]
  const stored = instanceId ? cache[instanceId] : undefined
  return {
    envVarExists: !!fromEnv,
    maskedEnvValue: fromEnv ? maskSecret(fromEnv) : null,
    storedKeyExists: !!stored,
    maskedStoredKey: stored ? maskSecret(stored) : null
  }
}

export async function setSecret(instanceId: string, value: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is not available on this system')
  }
  cache[instanceId] = value
  await persist()
  log.debug(`Secret stored for provider: ${instanceId}`)
}

export async function deleteSecret(instanceId: string): Promise<void> {
  if (!(instanceId in cache)) return
  delete cache[instanceId]
  await persist()
  log.debug(`Secret deleted for provider: ${instanceId}`)
}

export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
