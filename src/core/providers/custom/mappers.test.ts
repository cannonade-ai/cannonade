import { describe, it, expect } from 'vitest'
import { toLocalModel } from './mappers'

describe('custom provider toLocalModel', () => {
  it('maps an OpenAI model entry to a LocalModel', () => {
    const result = toLocalModel({ id: 'my-model', object: 'model', owned_by: 'me' }, 'custom-1')
    expect(result).toEqual({
      id: 'my-model',
      name: 'my-model',
      providerId: 'custom-1',
      sizeBytes: 0,
      type: 'llm',
      loadedInstances: [],
      meta: { owned_by: 'me' }
    })
  })

  it('omits owned_by from meta when absent', () => {
    const result = toLocalModel({ id: 'my-model', object: 'model' }, 'custom-1')
    expect(result.meta).toEqual({})
  })
})
