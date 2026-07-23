import { describe, it, expect } from 'vitest'
import { toExternalModel, toReasoningEffort, toChatRequest, toChatResponse } from './mappers'
import type { ChatCompletionResponse, Model } from './types'

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'openai/gpt-4',
    canonical_slug: 'openai/gpt-4',
    hugging_face_id: null,
    name: 'GPT-4',
    created: 1692901234,
    description: 'A large model.',
    context_length: 8192,
    architecture: {
      modality: 'text->text',
      input_modalities: ['text'],
      output_modalities: ['text'],
      tokenizer: 'GPT',
      instruct_type: 'chatml'
    },
    pricing: { prompt: '0.00003', completion: '0.00006', request: '0', image: '0' },
    top_provider: { context_length: 8192, max_completion_tokens: 4096, is_moderated: true },
    per_request_limits: null,
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    default_parameters: null,
    supported_voices: null,
    knowledge_cutoff: null,
    expiration_date: null,
    links: null,
    reasoning: null,
    ...overrides
  }
}

describe('openrouter toExternalModel', () => {
  it('maps core fields and derives the publisher from the id', () => {
    const result = toExternalModel(makeModel(), 'openrouter-1')
    expect(result).toMatchObject({
      id: 'openai/gpt-4',
      name: 'GPT-4',
      publisher: 'openai',
      providerId: 'openrouter-1',
      description: 'A large model.',
      contextLength: 8192,
      maxOutputTokens: 4096,
      supportedParameters: ['temperature', 'top_p', 'max_tokens'],
      createdAt: 1692901234
    })
  })

  it('normalizes per-token price strings to USD per 1M tokens', () => {
    const result = toExternalModel(makeModel(), 'openrouter-1')
    expect(result.pricing).toEqual({ inputPerMTokens: 30, outputPerMTokens: 60 })
  })

  it('normalizes prices without floating point drift', () => {
    const model = makeModel({
      pricing: { prompt: '0.000003', completion: '0.0000015' }
    })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.pricing).toEqual({ inputPerMTokens: 3, outputPerMTokens: 1.5 })
  })

  it('maps zero pricing to zero for free models', () => {
    const model = makeModel({ pricing: { prompt: '0', completion: '0' } })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.pricing).toEqual({ inputPerMTokens: 0, outputPerMTokens: 0 })
  })

  it('omits pricing when prices are the -1 unknown sentinel', () => {
    const model = makeModel({ pricing: { prompt: '-1', completion: '-1' } })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.pricing).toBeUndefined()
  })

  it('includes cacheReadPerMTokens when input_cache_read is present and non-zero', () => {
    const model = makeModel({
      pricing: { prompt: '0.00003', completion: '0.00006', input_cache_read: '0.0000075' }
    })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.pricing?.cacheReadPerMTokens).toBe(7.5)
  })

  it('maps input and output modalities', () => {
    const model = makeModel({
      architecture: {
        modality: 'text+image->text',
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
        tokenizer: 'GPT',
        instruct_type: null
      }
    })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.inputModalities).toEqual(['text', 'image'])
    expect(result.outputModalities).toEqual(['text'])
  })

  it('falls back to top_provider context length when context_length is null', () => {
    const model = makeModel({ context_length: null })
    expect(toExternalModel(model, 'openrouter-1').contextLength).toBe(8192)
  })

  it('omits description and maxOutputTokens when null', () => {
    const model = makeModel({ description: null, top_provider: null, context_length: 4096 })
    const result = toExternalModel(model, 'openrouter-1')
    expect(result.description).toBeUndefined()
    expect(result.maxOutputTokens).toBeUndefined()
    expect(result.contextLength).toBe(4096)
  })
})

function makeChatResponse(overrides: Partial<ChatCompletionResponse> = {}): ChatCompletionResponse {
  return {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1677652288,
    model: 'openai/gpt-4',
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        message: { role: 'assistant', content: 'The capital of France is Paris.' }
      }
    ],
    usage: {
      prompt_tokens: 25,
      completion_tokens: 10,
      total_tokens: 35,
      cost: 0.0012,
      cost_details: {
        upstream_inference_prompt_cost: 0.0008,
        upstream_inference_completions_cost: 0.0004
      },
      prompt_tokens_details: { cached_tokens: 2 },
      completion_tokens_details: { reasoning_tokens: 5 }
    },
    ...overrides
  }
}

describe('openrouter toChatRequest', () => {
  it('maps reasoning to a reasoning effort object', () => {
    const result = toChatRequest({ model: 'openai/gpt-4', input: 'Hello', reasoning: 'high' })
    expect(result.reasoning).toEqual({ effort: 'high' })
  })

  it('omits reasoning when not requested', () => {
    const result = toChatRequest({ model: 'openai/gpt-4', input: 'Hello' })
    expect(result.reasoning).toBeUndefined()
  })

  it('builds openai-compatible messages', () => {
    const result = toChatRequest({
      model: 'openai/gpt-4',
      input: 'Hello',
      system_prompt: 'Be helpful.'
    })
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' }
    ])
  })
})

describe('openrouter toChatResponse', () => {
  it('maps the message content and id', () => {
    const result = toChatResponse(makeChatResponse())
    expect(result.model_instance_id).toBe('chatcmpl-123')
    expect(result.output).toContainEqual({
      type: 'message',
      content: 'The capital of France is Paris.'
    })
  })

  it('maps the full usage block into stats', () => {
    const result = toChatResponse(makeChatResponse())
    expect(result.stats).toEqual({
      input_tokens: 25,
      total_output_tokens: 10,
      reasoning_output_tokens: 5,
      tokens_per_second: 0,
      time_to_first_token_seconds: 0,
      cached_input_tokens: 2,
      cost: 0.0012,
      cost_details: {
        upstream_inference_prompt_cost: 0.0008,
        upstream_inference_completions_cost: 0.0004
      }
    })
  })

  it('omits optional stats when usage details are absent', () => {
    const response = makeChatResponse({
      usage: { prompt_tokens: 25, completion_tokens: 10, total_tokens: 35 }
    })
    const result = toChatResponse(response)
    expect(result.stats.reasoning_output_tokens).toBe(0)
    expect(result.stats.cached_input_tokens).toBeUndefined()
    expect(result.stats.cost).toBeUndefined()
    expect(result.stats.cost_details).toBeUndefined()
  })

  it('emits a reasoning output item when the message carries reasoning', () => {
    const response = makeChatResponse({
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: 'Paris.',
            reasoning: 'The user asks about France.'
          }
        }
      ]
    })
    const result = toChatResponse(response)
    expect(result.output).toEqual([
      { type: 'reasoning', content: 'The user asks about France.' },
      { type: 'message', content: 'Paris.' }
    ])
  })

  it('falls back to empty content when the message content is null', () => {
    const response = makeChatResponse({
      choices: [
        { index: 0, finish_reason: 'length', message: { role: 'assistant', content: null } }
      ]
    })
    const result = toChatResponse(response)
    expect(result.output).toEqual([{ type: 'message', content: '' }])
  })
})

describe('openrouter toReasoningEffort', () => {
  it('maps off to none and on to medium', () => {
    expect(toReasoningEffort('off')).toBe('none')
    expect(toReasoningEffort('on')).toBe('medium')
  })

  it('passes explicit efforts through', () => {
    expect(toReasoningEffort('low')).toBe('low')
    expect(toReasoningEffort('medium')).toBe('medium')
    expect(toReasoningEffort('high')).toBe('high')
  })

  it('returns undefined when reasoning is not set', () => {
    expect(toReasoningEffort(undefined)).toBeUndefined()
  })
})
