import { describe, it, expect } from 'vitest'
import { toChatRequest } from './mappers'
import type { ChatRequest } from '@shared/provider/chat'

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return { model: 'test-model', ...overrides }
}

describe('ollama provider toChatRequest', () => {
  it('builds messages from string input and system prompt', () => {
    const result = toChatRequest(makeRequest({ input: 'Hello', system_prompt: 'Be helpful.' }))
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('passes messages through unchanged', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi' },
      { role: 'user' as const, content: 'How are you?' }
    ]
    const result = toChatRequest(makeRequest({ messages }))
    expect(result.messages).toEqual(messages)
  })

  it('prepends system_prompt when messages contain no system message', () => {
    const result = toChatRequest(
      makeRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        system_prompt: 'Be helpful.'
      })
    )
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('keeps the existing system message over system_prompt', () => {
    const result = toChatRequest(
      makeRequest({
        messages: [
          { role: 'system', content: 'From messages.' },
          { role: 'user', content: 'Hello' }
        ],
        system_prompt: 'From request.'
      })
    )
    expect(result.messages).toEqual([
      { role: 'system', content: 'From messages.' },
      { role: 'user', content: 'Hello' }
    ])
  })
})
