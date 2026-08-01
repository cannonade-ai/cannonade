import { describe, it, expect } from 'vitest'
import {
  isEventForModel,
  isLoadedStatus,
  parseSseEvents,
  toHfRepoId,
  toLoadFailureError,
  toChatRequest,
  toChatResponse,
  toDownloadProgress,
  toDownloadProgressFromEvent,
  toLocalModel,
  toLocalModelFromServedModel,
  toProviderError
} from './mappers'
import type { ChatRequest } from '@shared/provider/chat'
import type { LlamaCppChatResponse, LlamaCppRouterModel } from './types'

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return { model: 'test-model', ...overrides }
}

describe('llamacpp provider toChatRequest', () => {
  it('builds messages from string input and system prompt', () => {
    const result = toChatRequest(makeRequest({ input: 'Hello', system_prompt: 'Be helpful.' }))
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('forces non-streaming and requests timings', () => {
    const result = toChatRequest(makeRequest({ stream: true }))
    expect(result.stream).toBe(false)
    expect(result.timings_per_token).toBe(true)
  })

  it('passes sampling options through', () => {
    const result = toChatRequest(
      makeRequest({ temperature: 0.2, top_k: 10, min_p: 0.1, max_output_tokens: 128, seed: 7 })
    )
    expect(result.temperature).toBe(0.2)
    expect(result.top_k).toBe(10)
    expect(result.min_p).toBe(0.1)
    expect(result.max_tokens).toBe(128)
    expect(result.seed).toBe(7)
  })

  it('disables reasoning when reasoning is off', () => {
    expect(toChatRequest(makeRequest({ reasoning: 'off' })).reasoning_effort).toBe('none')
    expect(toChatRequest(makeRequest({ reasoning: 'high' })).reasoning_effort).toBeUndefined()
  })
})

describe('llamacpp provider toChatResponse', () => {
  const response: LlamaCppChatResponse = {
    id: 'chatcmpl-1',
    model: 'gemma-3-1b',
    choices: [{ message: { role: 'assistant', content: 'Hi', reasoning_content: 'thinking' } }],
    usage: {
      prompt_tokens: 44,
      completion_tokens: 48,
      total_tokens: 92,
      prompt_tokens_details: { cached_tokens: 12 }
    },
    timings: { prompt_ms: 30.958, predicted_per_second: 52.94 }
  }

  it('puts reasoning before the message', () => {
    expect(toChatResponse(response).output).toEqual([
      { type: 'reasoning', content: 'thinking' },
      { type: 'message', content: 'Hi' }
    ])
  })

  it('maps usage and timings into stats', () => {
    expect(toChatResponse(response).stats).toEqual({
      input_tokens: 44,
      total_output_tokens: 48,
      reasoning_output_tokens: 0,
      tokens_per_second: 52.94,
      time_to_first_token_seconds: 0.030958,
      cached_input_tokens: 12
    })
  })

  it('omits the reasoning item when the model produced none', () => {
    const plain: LlamaCppChatResponse = {
      ...response,
      choices: [{ message: { role: 'assistant', content: 'Hi' } }]
    }
    expect(toChatResponse(plain).output).toEqual([{ type: 'message', content: 'Hi' }])
  })
})

describe('llamacpp provider toLocalModel', () => {
  const model: LlamaCppRouterModel = {
    id: 'ggml-org/gemma-3-1b-it-qat-GGUF:Q4_0',
    status: { value: 'unloaded' },
    architecture: { input_modalities: ['text'], output_modalities: ['text'] },
    source: 'cache',
    can_remove: true
  }

  it('derives display name, publisher and quantization from the id', () => {
    const result = toLocalModel(model, 'instance-1')
    expect(result.name).toBe('gemma-3-1b-it-qat-GGUF')
    expect(result.meta.publisher).toBe('ggml-org')
    expect(result.meta.quantization).toBe('Q4_0')
    expect(result.providerId).toBe('instance-1')
  })

  it('reports no loaded instances when the model is unloaded', () => {
    expect(toLocalModel(model, 'instance-1').loadedInstances).toEqual([])
  })

  it('reports a loaded instance for loaded and sleeping models', () => {
    const loaded = toLocalModel(
      { ...model, status: { value: 'loaded' }, meta: { n_ctx_train: 4096, size: 1024 } },
      'instance-1'
    )
    expect(loaded.loadedInstances).toEqual([{ id: model.id, config: { context_length: 4096 } }])
    expect(loaded.sizeBytes).toBe(1024)

    const sleeping = toLocalModel({ ...model, status: { value: 'sleeping' } }, 'instance-1')
    expect(sleeping.loadedInstances).toHaveLength(1)
  })

  it('detects vision support from input modalities', () => {
    const vision = toLocalModel(
      { ...model, architecture: { input_modalities: ['text', 'image'] } },
      'instance-1'
    )
    expect(vision.capabilities?.vision).toBe(true)
  })

  it('classifies embedding models by name', () => {
    expect(toLocalModel({ ...model, id: 'ggml-org/nomic-embed-text' }, 'i').type).toBe('embedding')
    expect(toLocalModel(model, 'i').type).toBe('llm')
  })
})

describe('llamacpp provider toLocalModelFromServedModel', () => {
  it('treats a model with meta as loaded', () => {
    const result = toLocalModelFromServedModel(
      {
        id: '../models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
        meta: { size: 4912898304, n_ctx_train: 131072 }
      },
      'instance-1'
    )
    expect(result.sizeBytes).toBe(4912898304)
    expect(result.maxContextLength).toBe(131072)
    expect(result.loadedInstances).toHaveLength(1)
  })

  it('treats a model still loading (null meta) as not loaded', () => {
    const result = toLocalModelFromServedModel({ id: 'model.gguf', meta: null }, 'instance-1')
    expect(result.loadedInstances).toEqual([])
    expect(result.sizeBytes).toBe(0)
  })
})

describe('llamacpp provider toHfRepoId', () => {
  it('strips the Hugging Face host from a pasted url', () => {
    expect(toHfRepoId('https://huggingface.co/LiquidAI/LFM2.5-230M-GGUF')).toBe(
      'LiquidAI/LFM2.5-230M-GGUF'
    )
    expect(toHfRepoId('http://hf.co/LiquidAI/LFM2.5-230M-GGUF')).toBe('LiquidAI/LFM2.5-230M-GGUF')
    expect(toHfRepoId('huggingface.co/LiquidAI/LFM2.5-230M-GGUF')).toBe('LiquidAI/LFM2.5-230M-GGUF')
  })

  it('drops trailing slashes, extra path segments, query and hash', () => {
    expect(toHfRepoId('https://huggingface.co/LiquidAI/LFM2.5-230M-GGUF/')).toBe(
      'LiquidAI/LFM2.5-230M-GGUF'
    )
    expect(toHfRepoId('https://huggingface.co/LiquidAI/LFM2.5-230M-GGUF/tree/main')).toBe(
      'LiquidAI/LFM2.5-230M-GGUF'
    )
    expect(toHfRepoId('https://huggingface.co/LiquidAI/LFM2.5-230M-GGUF?library=gguf#files')).toBe(
      'LiquidAI/LFM2.5-230M-GGUF'
    )
  })

  it('keeps the quant suffix', () => {
    expect(toHfRepoId('https://huggingface.co/ggml-org/gemma-3-1b-it-qat-GGUF:Q4_0')).toBe(
      'ggml-org/gemma-3-1b-it-qat-GGUF:Q4_0'
    )
  })

  it('passes an already bare repo id through untouched', () => {
    expect(toHfRepoId('LiquidAI/LFM2.5-230M-GGUF')).toBe('LiquidAI/LFM2.5-230M-GGUF')
    expect(toHfRepoId('  LiquidAI/LFM2.5-230M-GGUF:Q4_0  ')).toBe('LiquidAI/LFM2.5-230M-GGUF:Q4_0')
  })

  it('leaves a single-segment target for the server to reject', () => {
    expect(toHfRepoId('some-model')).toBe('some-model')
  })
})

describe('llamacpp provider isLoadedStatus', () => {
  it('treats loaded and sleeping as loaded', () => {
    expect(isLoadedStatus({ value: 'loaded' })).toBe(true)
    expect(isLoadedStatus({ value: 'sleeping' })).toBe(true)
  })

  it('treats loading, unloaded, downloading and missing status as not loaded', () => {
    expect(isLoadedStatus({ value: 'loading' })).toBe(false)
    expect(isLoadedStatus({ value: 'unloaded' })).toBe(false)
    expect(isLoadedStatus({ value: 'downloading' })).toBe(false)
    expect(isLoadedStatus(undefined)).toBe(false)
  })
})

describe('llamacpp provider toLoadFailureError', () => {
  it('includes the exit code when the server reports one', () => {
    const error = toLoadFailureError('gemma', { value: 'unloaded', failed: true, exit_code: 1 })
    expect(error.message).toBe('Model "gemma" failed to load (exit code 1)')
    expect(error.code).toBe('load_failed')
  })

  it('omits the exit code when there is none', () => {
    expect(toLoadFailureError('gemma', { value: 'unloaded', failed: true }).message).toBe(
      'Model "gemma" failed to load'
    )
  })
})

describe('llamacpp provider isEventForModel', () => {
  it('matches the exact model name regardless of case', () => {
    expect(isEventForModel('ggml-org/gemma-3-1b-GGUF', 'ggml-org/gemma-3-1b-GGUF')).toBe(true)
    expect(isEventForModel('GGML-ORG/gemma-3-1b-gguf', 'ggml-org/gemma-3-1b-GGUF')).toBe(true)
  })

  it('matches when either side carries a quant suffix', () => {
    expect(isEventForModel('ggml-org/gemma-3-1b-GGUF:Q4_0', 'ggml-org/gemma-3-1b-GGUF')).toBe(true)
    expect(isEventForModel('ggml-org/gemma-3-1b-GGUF', 'ggml-org/gemma-3-1b-GGUF:Q4_0')).toBe(true)
  })

  it('rejects other models and missing names', () => {
    expect(isEventForModel('ggml-org/other-GGUF', 'ggml-org/gemma-3-1b-GGUF')).toBe(false)
    expect(isEventForModel('ggml-org/gemma-3-1b-GGUF-extra', 'ggml-org/gemma-3-1b-GGUF')).toBe(
      false
    )
    expect(isEventForModel(undefined, 'ggml-org/gemma-3-1b-GGUF')).toBe(false)
    expect(isEventForModel('*', 'ggml-org/gemma-3-1b-GGUF')).toBe(false)
  })
})

describe('llamacpp provider parseSseEvents', () => {
  it('parses complete events and keeps the trailing partial chunk', () => {
    const { events, rest } = parseSseEvents(
      'data: {"model":"a","event":"download_progress"}\n\ndata: {"model":"b","eve'
    )
    expect(events).toEqual([{ model: 'a', event: 'download_progress' }])
    expect(rest).toBe('data: {"model":"b","eve')
  })

  it('skips non-data lines and unparsable payloads', () => {
    const { events } = parseSseEvents(': keep-alive\n\ndata: not-json\n\ndata: {"model":"a"}\n\n')
    expect(events).toEqual([{ model: 'a' }])
  })
})

describe('llamacpp provider toDownloadProgressFromEvent', () => {
  const startedAt = new Date(Date.now() - 1000).toISOString()

  it('reads a file map sent directly as the event data', () => {
    const result = toDownloadProgressFromEvent(
      'job-1',
      { model: 'a', event: 'download_progress', data: { 'a.gguf': { done: 10, total: 100 } } },
      startedAt
    )
    expect(result?.downloaded_bytes).toBe(10)
    expect(result?.total_size_bytes).toBe(100)
  })

  it('reads a file map nested under progress', () => {
    const result = toDownloadProgressFromEvent(
      'job-1',
      {
        model: 'a',
        event: 'model_status',
        data: { status: 'downloading', progress: { 'a.gguf': { done: 10, total: 100 } } }
      },
      startedAt
    )
    expect(result?.downloaded_bytes).toBe(10)
    expect(result?.total_size_bytes).toBe(100)
  })

  it('returns undefined when the event carries no byte counts', () => {
    expect(
      toDownloadProgressFromEvent('job-1', { model: 'a', event: 'model_status' }, startedAt)
    ).toBeUndefined()
    expect(
      toDownloadProgressFromEvent(
        'job-1',
        { model: 'a', event: 'model_status', data: { status: 'loaded' } },
        startedAt
      )
    ).toBeUndefined()
  })

  it('ignores the load-progress shape, which carries no byte counts', () => {
    expect(
      toDownloadProgressFromEvent(
        'job-1',
        {
          model: 'a',
          event: 'model_status',
          data: {
            status: 'loading',
            progress: { stages: ['text_model'], current: 'text_model', value: 0.5 }
          }
        },
        startedAt
      )
    ).toBeUndefined()
  })
})

describe('llamacpp provider toDownloadProgress', () => {
  it('sums progress across parallel files', () => {
    const startedAt = new Date(Date.now() - 2000).toISOString()
    const result = toDownloadProgress(
      'job-1',
      { 'a.gguf': { done: 100, total: 400 }, 'b.gguf': { done: 50, total: 100 } },
      startedAt
    )
    expect(result.downloaded_bytes).toBe(150)
    expect(result.total_size_bytes).toBe(500)
    expect(result.status).toBe('downloading')
  })
})

describe('llamacpp provider toProviderError', () => {
  it('uses the message and type from the error body', () => {
    const error = toProviderError(401, 'Unauthorized', {
      error: { code: 401, message: 'Invalid API Key', type: 'authentication_error' }
    })
    expect(error.message).toBe('Invalid API Key')
    expect(error.status).toBe(401)
    expect(error.code).toBe('authentication_error')
  })

  it('falls back to the status text when there is no error body', () => {
    expect(toProviderError(500, 'Internal Server Error', undefined).message).toBe(
      'Internal Server Error'
    )
  })
})
