import { describe, it, expect } from 'vitest'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'
import { resolveApiKey, resolveProbeApiKey, type SecretSources } from './auth-resolution'

function provider(overrides: Partial<ConfiguredProvider>): ConfiguredProvider {
  return {
    instanceId: 'instance-1',
    type: 'custom',
    displayName: 'Custom',
    url: 'http://localhost:8080',
    isDefault: false,
    ...overrides
  }
}

describe('resolveApiKey', () => {
  it('reads the configured env variable for env auth', () => {
    const sources: SecretSources = { env: { MY_VAR: 'env-key' }, store: {} }
    const p = provider({ authMethod: 'env', envVarName: 'MY_VAR' })
    expect(resolveApiKey(p, sources)).toBe('env-key')
  })

  it('falls back to the default env variable when none is configured', () => {
    const sources: SecretSources = { env: { CUSTOM_API_KEY: 'default-key' }, store: {} }
    const p = provider({ authMethod: 'env' })
    expect(resolveApiKey(p, sources)).toBe('default-key')
  })

  it('ignores stored secrets for env auth', () => {
    const sources: SecretSources = { env: {}, store: { 'instance-1': 'stored-key' } }
    const p = provider({ authMethod: 'env', envVarName: 'MY_VAR' })
    expect(resolveApiKey(p, sources)).toBeUndefined()
  })

  it('reads the instance-scoped stored secret for stored auth', () => {
    const sources: SecretSources = {
      env: { CUSTOM_API_KEY: 'env-key' },
      store: { 'instance-1': 'stored-key' }
    }
    const p = provider({ authMethod: 'stored' })
    expect(resolveApiKey(p, sources)).toBe('stored-key')
  })

  it('returns undefined for none auth even when keys are available', () => {
    const sources: SecretSources = {
      env: { CUSTOM_API_KEY: 'env-key' },
      store: { 'instance-1': 'stored-key' }
    }
    const p = provider({ authMethod: 'none' })
    expect(resolveApiKey(p, sources)).toBeUndefined()
  })

  it('resolves different keys for two instances of the same type', () => {
    const sources: SecretSources = {
      env: { ENDPOINT_A_KEY: 'key-a' },
      store: { 'instance-b': 'key-b' }
    }
    const a = provider({
      instanceId: 'instance-a',
      authMethod: 'env',
      envVarName: 'ENDPOINT_A_KEY'
    })
    const b = provider({ instanceId: 'instance-b', authMethod: 'stored' })
    expect(resolveApiKey(a, sources)).toBe('key-a')
    expect(resolveApiKey(b, sources)).toBe('key-b')
  })
})

describe('resolveProbeApiKey', () => {
  it('resolves via env variable when probing with env auth', () => {
    const sources: SecretSources = { env: { MY_VAR: 'env-key' }, store: {} }
    expect(resolveProbeApiKey('custom', { authMethod: 'env', envVarName: 'MY_VAR' }, sources)).toBe(
      'env-key'
    )
  })

  it('resolves via instance secret when probing an existing provider', () => {
    const sources: SecretSources = { env: {}, store: { 'instance-1': 'stored-key' } }
    expect(
      resolveProbeApiKey('custom', { authMethod: 'stored', instanceId: 'instance-1' }, sources)
    ).toBe('stored-key')
  })

  it('returns undefined for stored auth without an instance', () => {
    const sources: SecretSources = { env: {}, store: {} }
    expect(resolveProbeApiKey('custom', { authMethod: 'stored' }, sources)).toBeUndefined()
  })

  it('returns undefined for none auth and missing auth context', () => {
    const sources: SecretSources = { env: { CUSTOM_API_KEY: 'env-key' }, store: {} }
    expect(resolveProbeApiKey('custom', { authMethod: 'none' }, sources)).toBeUndefined()
    expect(resolveProbeApiKey('custom', undefined, sources)).toBeUndefined()
  })
})
