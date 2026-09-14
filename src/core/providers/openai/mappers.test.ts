import { describe, it, expect } from 'vitest'
import { toExternalModel, toChatRequest, toChatResponse, toProviderError } from './mappers'
import type { ChatCompletionResponse, Model } from './types'

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'gpt-5-nano',
    object: 'model',
    created: 1754426303,
    owned_by: 'system',
    shutdown_date: null,
    ...overrides
  }
}

function makeResponse(overrides: Partial<ChatCompletionResponse> = {}): ChatCompletionResponse {
  return {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1789292764,
    model: 'gpt-5-nano-2025-08-07',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: 'pong', refusal: null },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 11,
      completion_tokens: 74,
      total_tokens: 85,
      prompt_tokens_details: { cached_tokens: 3, audio_tokens: 0 },
      completion_tokens_details: { reasoning_tokens: 64, audio_tokens: 0 }
    },
    ...overrides
  }
}

describe('openai toExternalModel', () => {
  it('enriches the model with metadata from the built-in table', () => {
    const result = toExternalModel(makeModel(), 'openai-1')
    expect(result).toMatchObject({
      id: 'gpt-5-nano',
      name: 'gpt-5-nano',
      publisher: 'system',
      providerId: 'openai-1',
      contextLength: 400000,
      maxOutputTokens: 128000,
      createdAt: 1754426303
    })
    expect(result.pricing).toEqual({
      inputPerMTokens: 0.05,
      outputPerMTokens: 0.4,
      cacheReadPerMTokens: 0.005
    })
  })

  it('keeps the dated snapshot id as the name while taking its base model metadata', () => {
    const result = toExternalModel(makeModel({ id: 'gpt-5-nano-2025-08-07' }), 'openai-1')
    expect(result.name).toBe('gpt-5-nano-2025-08-07')
    expect(result.contextLength).toBe(400000)
  })

  it('falls back to the raw id with no details for an unknown model', () => {
    const result = toExternalModel(makeModel({ id: 'gpt-9-unreleased' }), 'openai-1')
    expect(result.name).toBe('gpt-9-unreleased')
    expect(result.contextLength).toBe(0)
    expect(result.pricing).toBeUndefined()
  })

  it('maps shutdown_date onto the expiration date', () => {
    const result = toExternalModel(makeModel({ shutdown_date: '2026-12-11' }), 'openai-1')
    expect(result.expirationDate).toBe('2026-12-11')
  })

  it('keeps the raw endpoint object', () => {
    const result = toExternalModel(makeModel(), 'openai-1')
    expect(result.raw).toMatchObject({ id: 'gpt-5-nano', owned_by: 'system' })
  })
})

describe('openai toChatRequest', () => {
  it('sends every parameter the user set, even ones the api may reject', () => {
    const body = toChatRequest({
      model: 'gpt-5-nano',
      input: 'Hi',
      top_k: 40,
      min_p: 0.05,
      repeat_penalty: 1.1
    })
    expect(body).toMatchObject({ top_k: 40, min_p: 0.05, repeat_penalty: 1.1 })
  })

  it('omits parameters the user left unset', () => {
    const body = toChatRequest({ model: 'gpt-5-nano', input: 'Hi' })
    expect(Object.keys(body).sort()).toEqual(['messages', 'model'])
  })

  it('sends the token cap as max_completion_tokens', () => {
    const body = toChatRequest({ model: 'gpt-5-nano', input: 'Hi', max_output_tokens: 150 })
    expect(body.max_completion_tokens).toBe(150)
    expect(body).not.toHaveProperty('max_tokens')
  })

  it('sends reasoning effort as a bare string', () => {
    const body = toChatRequest({ model: 'gpt-5-mini', input: 'Hi', reasoning: 'low' })
    expect(body.reasoning_effort).toBe('low')
  })

  it('maps the off and on reasoning levels onto the api enum', () => {
    expect(toChatRequest({ model: 'm', input: 'Hi', reasoning: 'off' }).reasoning_effort).toBe(
      'none'
    )
    expect(toChatRequest({ model: 'm', input: 'Hi', reasoning: 'on' }).reasoning_effort).toBe(
      'medium'
    )
  })

  it('sends the system prompt as a system message', () => {
    const body = toChatRequest({ model: 'm', input: 'Hi', system_prompt: 'Be brief.' })
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Be brief.' })
  })

  it('merges extra request data verbatim, whatever it contains', () => {
    const body = toChatRequest({
      model: 'm',
      input: 'Hi',
      extra_request_data: { service_tier: 'flex', NOT_A_REAL_PARAM: 5 }
    })
    expect(body).toMatchObject({ service_tier: 'flex', NOT_A_REAL_PARAM: 5 })
  })
})

describe('openai toChatResponse', () => {
  it('maps the message and usage', () => {
    const result = toChatResponse(makeResponse())
    expect(result.model_instance_id).toBe('chatcmpl-123')
    expect(result.output).toEqual([{ type: 'message', content: 'pong' }])
    expect(result.stats).toMatchObject({
      input_tokens: 11,
      total_output_tokens: 74,
      reasoning_output_tokens: 64,
      cached_input_tokens: 3
    })
  })

  it('surfaces a refusal as the message content', () => {
    const result = toChatResponse(
      makeResponse({
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: null, refusal: 'I cannot help with that.' },
            finish_reason: 'stop'
          }
        ]
      })
    )
    expect(result.output).toEqual([{ type: 'message', content: 'I cannot help with that.' }])
  })

  it('defaults to empty output when usage and content are missing', () => {
    const result = toChatResponse(makeResponse({ choices: [], usage: undefined }))
    expect(result.output).toEqual([{ type: 'message', content: '' }])
    expect(result.stats.input_tokens).toBe(0)
    expect(result.stats.cached_input_tokens).toBeUndefined()
  })
})

describe('openai toProviderError', () => {
  it('separates an exhausted quota from ordinary rate limiting', () => {
    const quota = toProviderError(
      429,
      JSON.stringify({ error: { message: 'You exceeded your quota', code: 'insufficient_quota' } })
    )
    expect(quota.message).toContain('quota')
    expect(quota.code).toBe('insufficient_quota')

    const rateLimit = toProviderError(
      429,
      JSON.stringify({ error: { code: 'rate_limit_exceeded' } })
    )
    expect(rateLimit.message).toContain('Rate limited')
  })

  it('reports an invalid key', () => {
    const err = toProviderError(
      401,
      JSON.stringify({ error: { message: 'Incorrect API key provided', code: 'invalid_api_key' } })
    )
    expect(err.message).toContain('Invalid or missing OpenAI API key')
    expect(err.status).toBe(401)
  })

  it('passes through the api message for other failures', () => {
    const err = toProviderError(
      404,
      JSON.stringify({
        error: { message: 'The model `gpt-does-not-exist` does not exist', code: 'model_not_found' }
      })
    )
    expect(err.message).toBe('The model `gpt-does-not-exist` does not exist')
  })

  it('falls back to the status when the body is not json', () => {
    const err = toProviderError(500, '<html>Server Error</html>')
    expect(err.message).toBe('HTTP 500')
  })
})
