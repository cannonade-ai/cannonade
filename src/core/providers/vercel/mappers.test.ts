import { describe, it, expect } from 'vitest'
import { toExternalModel, toChatPrompt, toChatResponse } from './mappers'
import type { GatewayModel, StreamedChatResult } from './types'

function makeModel(overrides: Partial<GatewayModel> = {}): GatewayModel {
  return {
    id: 'openai/gpt-5',
    object: 'model',
    created: 1755815280,
    released: 1763424000,
    owned_by: 'openai',
    name: 'GPT-5',
    description: 'A large model.',
    context_window: 400000,
    max_tokens: 128000,
    type: 'language',
    tags: ['tool-use', 'reasoning'],
    pricing: { input: '0.00000125', output: '0.00001' },
    ...overrides
  }
}

describe('vercel toExternalModel', () => {
  it('maps core fields', () => {
    const result = toExternalModel(makeModel(), 'vercel-1')
    expect(result).toMatchObject({
      id: 'openai/gpt-5',
      name: 'GPT-5',
      publisher: 'openai',
      providerId: 'vercel-1',
      description: 'A large model.',
      contextLength: 400000,
      maxOutputTokens: 128000,
      createdAt: 1755815280,
      releasedAt: 1763424000
    })
  })

  it('falls back between created and released when one is missing', () => {
    const noCreated = toExternalModel(makeModel({ created: undefined }), 'vercel-1')
    expect(noCreated.createdAt).toBe(1763424000)
    expect(noCreated.releasedAt).toBe(1763424000)

    const noReleased = toExternalModel(makeModel({ released: undefined }), 'vercel-1')
    expect(noReleased.createdAt).toBe(1755815280)
    expect(noReleased.releasedAt).toBe(1755815280)
  })

  it('derives the publisher from the id when owned_by is absent', () => {
    const result = toExternalModel(makeModel({ owned_by: undefined }), 'vercel-1')
    expect(result.publisher).toBe('openai')
  })

  it('normalizes per-token price strings to USD per 1M tokens', () => {
    const result = toExternalModel(makeModel(), 'vercel-1')
    expect(result.pricing).toEqual({ inputPerMTokens: 1.25, outputPerMTokens: 10 })
  })

  it('includes cacheReadPerMTokens when input_cache_read is present and non-zero', () => {
    const model = makeModel({
      pricing: { input: '0.00000125', output: '0.00001', input_cache_read: '0.000000125' }
    })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.pricing?.cacheReadPerMTokens).toBe(0.125)
  })

  it('omits pricing when input or output price is missing', () => {
    const result = toExternalModel(makeModel({ pricing: { input: '0.00000125' } }), 'vercel-1')
    expect(result.pricing).toBeUndefined()
  })

  it('maps text-only modalities by default', () => {
    const result = toExternalModel(makeModel(), 'vercel-1')
    expect(result.inputModalities).toEqual(['text'])
    expect(result.outputModalities).toEqual(['text'])
  })

  it('adds image and file input modalities from tags', () => {
    const model = makeModel({ tags: ['vision', 'file-input', 'tool-use'] })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.inputModalities).toEqual(['text', 'image', 'file'])
  })

  it('maps embedding models to the embeddings output modality', () => {
    const model = makeModel({ type: 'embedding' })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.outputModalities).toEqual(['embeddings'])
  })

  it('prefers explicit modalities over tags and type', () => {
    const model = makeModel({
      type: 'video',
      tags: ['video-generation', 'vision'],
      modalities: { input: ['text', 'image'], output: ['video'] }
    })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.inputModalities).toEqual(['text', 'image'])
    expect(result.outputModalities).toEqual(['video'])
  })

  it('maps supported parameters and knowledge cutoff', () => {
    const model = makeModel({
      supported_parameters: ['max_tokens', 'temperature', 'stop'],
      knowledge: '2024-10'
    })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.supportedParameters).toEqual(['max_tokens', 'temperature', 'stop'])
    expect(result.knowledgeCutoff).toBe('2024-10')
  })

  it('omits supported parameters and knowledge cutoff when absent', () => {
    const result = toExternalModel(makeModel(), 'vercel-1')
    expect(result.supportedParameters).toBeUndefined()
    expect(result.knowledgeCutoff).toBeUndefined()
  })

  it('keeps the raw endpoint response', () => {
    const model = makeModel()
    const result = toExternalModel(model, 'vercel-1')
    expect(result.raw).toEqual(model)
  })

  it('falls back to zero context length and omits optional fields when absent', () => {
    const model = makeModel({
      description: undefined,
      context_window: undefined,
      max_tokens: undefined,
      created: undefined,
      released: undefined
    })
    const result = toExternalModel(model, 'vercel-1')
    expect(result.contextLength).toBe(0)
    expect(result.description).toBeUndefined()
    expect(result.maxOutputTokens).toBeUndefined()
    expect(result.createdAt).toBeUndefined()
    expect(result.releasedAt).toBeUndefined()
  })
})

describe('vercel toChatPrompt', () => {
  it('maps the system prompt to instructions and string input to a user message', () => {
    const result = toChatPrompt({
      model: 'openai/gpt-5',
      input: 'Hello',
      system_prompt: 'Be helpful.'
    })
    expect(result.instructions).toBe('Be helpful.')
    expect(result.messages).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('omits instructions when there is no system prompt', () => {
    const result = toChatPrompt({ model: 'openai/gpt-5', input: 'Hello' })
    expect(result.instructions).toBeUndefined()
    expect(result.messages).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('joins text input items into a single user message', () => {
    const result = toChatPrompt({
      model: 'openai/gpt-5',
      input: [
        { type: 'message', content: 'First' },
        { type: 'message', content: 'Second' }
      ]
    })
    expect(result.messages).toEqual([{ role: 'user', content: 'First\nSecond' }])
  })

  it('keeps multi-turn messages and moves the system prompt to instructions', () => {
    const result = toChatPrompt({
      model: 'openai/gpt-5',
      system_prompt: 'Be helpful.',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' }
      ]
    })
    expect(result.instructions).toBe('Be helpful.')
    expect(result.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'How are you?' }
    ])
  })

  it('moves an existing system message to instructions instead of the system prompt', () => {
    const result = toChatPrompt({
      model: 'openai/gpt-5',
      system_prompt: 'Ignored.',
      messages: [
        { role: 'system', content: 'Original system.' },
        { role: 'user', content: 'Hi' }
      ]
    })
    expect(result.instructions).toBe('Original system.')
    expect(result.messages).toEqual([{ role: 'user', content: 'Hi' }])
  })
})

function makeStreamedResult(overrides: Partial<StreamedChatResult> = {}): StreamedChatResult {
  return {
    text: 'Paris.',
    reasoningText: '',
    modelId: 'openai/gpt-5',
    inputTokens: 25,
    outputTokens: 10,
    reasoningTokens: 0,
    cachedInputTokens: undefined,
    requestStartedAt: 10000,
    firstTokenAt: 10500,
    streamEndedAt: 12500,
    ...overrides
  }
}

describe('vercel toChatResponse', () => {
  it('maps the message content and model id', () => {
    const result = toChatResponse(makeStreamedResult())
    expect(result.model_instance_id).toBe('openai/gpt-5')
    expect(result.output).toEqual([{ type: 'message', content: 'Paris.' }])
  })

  it('emits a reasoning output item first when reasoning text is present', () => {
    const result = toChatResponse(makeStreamedResult({ reasoningText: 'Thinking about France.' }))
    expect(result.output).toEqual([
      { type: 'reasoning', content: 'Thinking about France.' },
      { type: 'message', content: 'Paris.' }
    ])
  })

  it('computes timing stats from the stream timestamps', () => {
    const result = toChatResponse(makeStreamedResult())
    expect(result.stats.time_to_first_token_seconds).toBe(0.5)
    expect(result.stats.tokens_per_second).toBe(5)
  })

  it('maps usage into stats', () => {
    const result = toChatResponse(makeStreamedResult({ reasoningTokens: 4, cachedInputTokens: 12 }))
    expect(result.stats.input_tokens).toBe(25)
    expect(result.stats.total_output_tokens).toBe(10)
    expect(result.stats.reasoning_output_tokens).toBe(4)
    expect(result.stats.cached_input_tokens).toBe(12)
  })

  it('falls back to zero stats when usage and timing are unavailable', () => {
    const result = toChatResponse(
      makeStreamedResult({
        inputTokens: undefined,
        outputTokens: undefined,
        reasoningTokens: undefined,
        firstTokenAt: undefined
      })
    )
    expect(result.stats.input_tokens).toBe(0)
    expect(result.stats.total_output_tokens).toBe(0)
    expect(result.stats.reasoning_output_tokens).toBe(0)
    expect(result.stats.tokens_per_second).toBe(0)
    expect(result.stats.time_to_first_token_seconds).toBe(0)
    expect(result.stats.cached_input_tokens).toBeUndefined()
  })
})
