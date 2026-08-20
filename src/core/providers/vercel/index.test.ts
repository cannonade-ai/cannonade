import { describe, it, expect } from 'vitest'
import { createVercelProvider } from './index'
import { ProviderError } from '../base'

describe('vercel provider chat', () => {
  it('rejects requests carrying extra_request_data before sending them', async () => {
    const provider = createVercelProvider('vercel-1', 'https://ai-gateway.vercel.sh', 'key')
    await expect(
      provider.chat!({
        model: 'openai/gpt-4',
        input: 'Hello',
        extra_request_data: { response_format: { type: 'json_schema' } }
      })
    ).rejects.toThrow('does not support extra request data')
  })

  it('throws a ProviderError so the run reports it as a provider failure', async () => {
    const provider = createVercelProvider('vercel-1', 'https://ai-gateway.vercel.sh', 'key')
    await expect(
      provider.chat!({ model: 'openai/gpt-4', input: 'Hello', extra_request_data: { a: 1 } })
    ).rejects.toBeInstanceOf(ProviderError)
  })
})
