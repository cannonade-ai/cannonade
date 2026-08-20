import { describe, it, expect } from 'vitest'
import { toChatRequest, toSingleTurnRequest } from './mappers'
import type { ChatRequest } from '@shared/provider/chat'

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return { model: 'test-model', ...overrides }
}

describe('lmstudio toSingleTurnRequest', () => {
  it('returns the request unchanged when no messages are present', () => {
    const request = makeRequest({ input: 'Hello', system_prompt: 'Be helpful.' })
    expect(toSingleTurnRequest(request)).toBe(request)
  })

  it('converts a single user message to input', () => {
    const result = toSingleTurnRequest(
      makeRequest({ messages: [{ role: 'user', content: 'Hello' }] })
    )
    expect(result).toMatchObject({ input: 'Hello', messages: undefined })
  })

  it('converts system + user messages to system_prompt and input', () => {
    const result = toSingleTurnRequest(
      makeRequest({
        messages: [
          { role: 'system', content: 'Be helpful.' },
          { role: 'user', content: 'Hello' }
        ]
      })
    )
    expect(result).toMatchObject({
      input: 'Hello',
      system_prompt: 'Be helpful.',
      messages: undefined
    })
  })

  it('falls back to the request system_prompt when messages have no system message', () => {
    const result = toSingleTurnRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        system_prompt: 'From request.'
      })
    )
    expect(result).toMatchObject({ input: 'Hello', system_prompt: 'From request.' })
  })

  it('returns null for multi-turn conversations', () => {
    const result = toSingleTurnRequest(
      makeRequest({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' }
        ]
      })
    )
    expect(result).toBeNull()
  })

  it('returns null when the only non-system message is from the assistant', () => {
    const result = toSingleTurnRequest(
      makeRequest({ messages: [{ role: 'assistant', content: 'Hi' }] })
    )
    expect(result).toBeNull()
  })

  it('returns null when multiple system messages are present', () => {
    const result = toSingleTurnRequest(
      makeRequest({
        messages: [
          { role: 'system', content: 'One.' },
          { role: 'system', content: 'Two.' },
          { role: 'user', content: 'Hello' }
        ]
      })
    )
    expect(result).toBeNull()
  })
})

describe('lmstudio toChatRequest', () => {
  it('merges extra_request_data over the mapped body', () => {
    const result = toChatRequest(
      makeRequest({
        input: 'Hello',
        temperature: 0.2,
        extra_request_data: { temperature: 0.9, structured_output: { type: 'json_schema' } }
      })
    )
    expect(result.temperature).toBe(0.9)
    expect(result).toMatchObject({ structured_output: { type: 'json_schema' } })
  })
})

describe('lmstudio toSingleTurnRequest with extra_request_data', () => {
  it('carries extra_request_data into the converted request', () => {
    const result = toSingleTurnRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        extra_request_data: { structured_output: { type: 'json_schema' } }
      })
    )
    expect(result?.extra_request_data).toEqual({ structured_output: { type: 'json_schema' } })
  })
})
