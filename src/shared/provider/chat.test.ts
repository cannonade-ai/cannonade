import { describe, it, expect } from 'vitest'
import { hasExtraRequestData, withExtraRequestData } from './chat'
import type { ChatRequest } from './chat'

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return { model: 'test-model', ...overrides }
}

describe('hasExtraRequestData', () => {
  it('is false when the field is absent', () => {
    expect(hasExtraRequestData(makeRequest())).toBe(false)
  })

  it('is false for an empty object', () => {
    expect(hasExtraRequestData(makeRequest({ extra_request_data: {} }))).toBe(false)
  })

  it('is true when at least one key is present', () => {
    expect(hasExtraRequestData(makeRequest({ extra_request_data: { a: 1 } }))).toBe(true)
  })
})

describe('withExtraRequestData', () => {
  it('returns the body unchanged when there is nothing to merge', () => {
    const body = { model: 'test-model', temperature: 0.2 }
    expect(withExtraRequestData(body, makeRequest())).toBe(body)
    expect(withExtraRequestData(body, makeRequest({ extra_request_data: {} }))).toBe(body)
  })

  it('merges keys the body does not define', () => {
    const result = withExtraRequestData(
      { model: 'test-model' },
      makeRequest({ extra_request_data: { response_format: { type: 'json_object' } } })
    )
    expect(result).toEqual({ model: 'test-model', response_format: { type: 'json_object' } })
  })

  it('lets extra data win over the mapped body', () => {
    const result = withExtraRequestData(
      { model: 'test-model', temperature: 0.2 },
      makeRequest({ extra_request_data: { temperature: 0.9 } })
    )
    expect(result.temperature).toBe(0.9)
  })

  it('does not mutate the body it is given', () => {
    const body = { model: 'test-model', temperature: 0.2 }
    withExtraRequestData(body, makeRequest({ extra_request_data: { temperature: 0.9 } }))
    expect(body.temperature).toBe(0.2)
  })
})
