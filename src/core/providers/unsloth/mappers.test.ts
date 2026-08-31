import { describe, it, expect } from 'vitest'
import {
  isModelLoaded,
  toChatRequest,
  toChatResponse,
  toDownloadStatus,
  toLocalModel,
  toModelKey,
  toModelSelector,
  toLocalModels,
  toProviderError,
  toRepoId
} from './mappers'
import type { ChatRequest } from '@shared/provider/chat'
import type { UnslothChatResponse, UnslothModel } from './types'

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return { model: 'test-model', ...overrides }
}

function makeModel(overrides: Partial<UnslothModel> = {}): UnslothModel {
  return { id: 'unsloth/Qwen3-4B-GGUF', object: 'model', ...overrides }
}

describe('unsloth provider toModelKey and toModelSelector', () => {
  it('joins a repo and variant into a single key', () => {
    expect(toModelKey('unsloth/Qwen3-4B-GGUF', 'Q4_K_M')).toBe('unsloth/Qwen3-4B-GGUF:Q4_K_M')
  })

  it('leaves the repo untouched when there is no variant', () => {
    expect(toModelKey('unsloth/Qwen3-4B-GGUF')).toBe('unsloth/Qwen3-4B-GGUF')
  })

  it('splits a key back into its repo and variant', () => {
    expect(toModelSelector('unsloth/Qwen3-4B-GGUF:Q4_K_M')).toEqual({
      repoId: 'unsloth/Qwen3-4B-GGUF',
      variant: 'Q4_K_M'
    })
  })

  it('reads a key without a variant as a bare repo', () => {
    expect(toModelSelector('LFM2.5-230M-GGUF')).toEqual({ repoId: 'LFM2.5-230M-GGUF' })
  })

  it('keeps a windows path intact', () => {
    expect(toModelSelector('D:\\lmstudio\\models\\unsloth\\Qwen3-GGUF')).toEqual({
      repoId: 'D:\\lmstudio\\models\\unsloth\\Qwen3-GGUF'
    })
  })
})

describe('unsloth provider toRepoId', () => {
  it('strips a huggingface model card URL down to the repo id', () => {
    expect(toRepoId('https://huggingface.co/unsloth/gemma-3-12b-it-GGUF')).toBe(
      'unsloth/gemma-3-12b-it-GGUF'
    )
  })

  it('drops trailing path segments from a file URL', () => {
    expect(toRepoId('https://huggingface.co/unsloth/Qwen3-4B-GGUF/tree/main')).toBe(
      'unsloth/Qwen3-4B-GGUF'
    )
  })

  it('leaves a bare repo id untouched', () => {
    expect(toRepoId('unsloth/Qwen3-4B-GGUF')).toBe('unsloth/Qwen3-4B-GGUF')
  })
})

describe('unsloth provider toLocalModel', () => {
  it('keys a quantized model by repo and variant', () => {
    const model = toLocalModel(makeModel({ quant: 'Q4_K_M' }), 'instance-1')
    expect(model.id).toBe('unsloth/Qwen3-4B-GGUF:Q4_K_M')
    expect(model.meta.quantization).toBe('Q4_K_M')
    expect(model.meta.publisher).toBe('unsloth')
  })

  it('reports a loaded model as one loaded instance', () => {
    const model = toLocalModel(
      makeModel({ loaded: true, quant: 'Q8_0', context_length: 128000 }),
      'instance-1'
    )
    expect(model.loadedInstances).toEqual([
      { id: 'unsloth/Qwen3-4B-GGUF:Q8_0', config: { context_length: 128000 } }
    ])
  })

  it('reports an unloaded model with no instances', () => {
    expect(toLocalModel(makeModel({ loaded: false }), 'instance-1').loadedInstances).toEqual([])
  })

  it('prefers the display name over the repo tail', () => {
    expect(toLocalModel(makeModel({ display_name: 'Qwen3 4B' }), 'instance-1').name).toBe(
      'Qwen3 4B'
    )
    expect(toLocalModel(makeModel(), 'instance-1').name).toBe('Qwen3-4B-GGUF')
  })

  it('detects embedding models by name', () => {
    expect(toLocalModel(makeModel({ id: 'unsloth/nomic-embed-text' }), 'i').type).toBe('embedding')
    expect(toLocalModel(makeModel(), 'i').type).toBe('llm')
  })
})

describe('unsloth provider toLocalModels', () => {
  it('applies the status capabilities to the loaded model only', () => {
    const models = [
      makeModel({ id: 'unsloth/Qwen3-4B-GGUF', loaded: true }),
      makeModel({ id: 'unsloth/gemma-3-12b-it-GGUF' })
    ]
    const result = toLocalModels(models, 'i', {
      loaded: ['unsloth/Qwen3-4B-GGUF'],
      is_vision: true,
      supports_tools: true
    })
    expect(result[0].capabilities).toEqual({ vision: true, trained_for_tool_use: true })
    expect(result[1].capabilities).toBeUndefined()
  })

  it('reads missing status flags as unsupported', () => {
    const result = toLocalModels([makeModel({ loaded: true })], 'i', {
      loaded: ['unsloth/Qwen3-4B-GGUF']
    })
    expect(result[0].capabilities).toEqual({ vision: false, trained_for_tool_use: false })
  })

  it('leaves every model untouched when nothing is loaded', () => {
    expect(toLocalModels([makeModel()], 'i', { loaded: [] })[0].capabilities).toBeUndefined()
  })

  it('maps models unchanged when the status is unavailable', () => {
    const result = toLocalModels([makeModel({ quant: 'Q4_K_M' })], 'i', undefined)
    expect(result[0].id).toBe('unsloth/Qwen3-4B-GGUF:Q4_K_M')
    expect(result[0].capabilities).toBeUndefined()
  })

  it('backfills the variant the model list omits for the active model', () => {
    const result = toLocalModels([makeModel({ loaded: true })], 'i', {
      active_model: 'unsloth/Qwen3-4B-GGUF',
      gguf_variant: 'Q8_0',
      loaded: ['unsloth/Qwen3-4B-GGUF']
    })
    expect(result[0].id).toBe('unsloth/Qwen3-4B-GGUF:Q8_0')
    expect(result[0].meta.quantization).toBe('Q8_0')
  })

  it('keeps the variant the model list already reports', () => {
    const result = toLocalModels([makeModel({ loaded: true, quant: 'Q4_K_M' })], 'i', {
      active_model: 'unsloth/Qwen3-4B-GGUF',
      gguf_variant: 'Q8_0',
      loaded: ['unsloth/Qwen3-4B-GGUF']
    })
    expect(result[0].meta.quantization).toBe('Q4_K_M')
  })

  it('does not put the active variant on other models', () => {
    const result = toLocalModels([makeModel({ id: 'unsloth/gemma-3-12b-it-GGUF' })], 'i', {
      active_model: 'unsloth/Qwen3-4B-GGUF',
      gguf_variant: 'Q8_0',
      loaded: ['unsloth/Qwen3-4B-GGUF']
    })
    expect(result[0].id).toBe('unsloth/gemma-3-12b-it-GGUF')
    expect(result[0].meta.quantization).toBeUndefined()
  })
})

describe('unsloth provider isModelLoaded', () => {
  it('matches a keyed model against the bare repo the status reports', () => {
    const status = { loaded: ['LiquidAI/LFM2.5-230M-GGUF'] }
    expect(isModelLoaded(status, 'LiquidAI/LFM2.5-230M-GGUF:Q8_0')).toBe(true)
  })

  it('reports an absent model as not loaded', () => {
    expect(isModelLoaded({ loaded: [] }, 'unsloth/Qwen3-4B-GGUF:Q4_K_M')).toBe(false)
  })
})

describe('unsloth provider toChatRequest', () => {
  it('sends the bare repo id as the model, without the variant', () => {
    const result = toChatRequest(makeRequest({ model: 'unsloth/Qwen3-4B-GGUF:Q4_K_M' }))
    expect(result.model).toBe('unsloth/Qwen3-4B-GGUF')
  })

  it('builds messages from string input and system prompt', () => {
    const result = toChatRequest(makeRequest({ input: 'Hello', system_prompt: 'Be helpful.' }))
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' }
    ])
  })

  it('prepends system_prompt when messages contain no system message', () => {
    const result = toChatRequest(
      makeRequest({ messages: [{ role: 'user', content: 'Hi' }], system_prompt: 'Be helpful.' })
    )
    expect(result.messages).toEqual([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hi' }
    ])
  })

  it('never streams', () => {
    expect(toChatRequest(makeRequest({ stream: true })).stream).toBe(false)
  })

  it('merges extra_request_data over the mapped body', () => {
    const result = toChatRequest(makeRequest({ extra_request_data: { cache_prompt: false } }))
    expect(result).toMatchObject({ cache_prompt: false })
  })
})

describe('unsloth provider toChatResponse', () => {
  function makeResponse(overrides: Partial<UnslothChatResponse> = {}): UnslothChatResponse {
    return {
      id: 'chatcmpl-ac56e21e5e3d',
      model: 'LiquidAI/LFM2.5-230M-GGUF',
      choices: [{ message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }],
      ...overrides
    }
  }

  it('maps the message and token usage', () => {
    const result = toChatResponse(
      makeResponse({
        usage: {
          prompt_tokens: 32,
          completion_tokens: 15,
          total_tokens: 47,
          prompt_tokens_details: { cached_tokens: 8 }
        }
      })
    )
    expect(result.model_instance_id).toBe('LiquidAI/LFM2.5-230M-GGUF')
    expect(result.output).toEqual([{ type: 'message', content: 'Hello!' }])
    expect(result.stats.input_tokens).toBe(32)
    expect(result.stats.total_output_tokens).toBe(15)
    expect(result.stats.cached_input_tokens).toBe(8)
  })

  it('puts reasoning content before the message', () => {
    const result = toChatResponse(
      makeResponse({
        choices: [{ message: { content: 'Answer', reasoning_content: 'Thinking' } }],
        usage: { completion_tokens_details: { reasoning_tokens: 12 } }
      })
    )
    expect(result.output).toEqual([
      { type: 'reasoning', content: 'Thinking' },
      { type: 'message', content: 'Answer' }
    ])
    expect(result.stats.reasoning_output_tokens).toBe(12)
  })

  it('falls back to an empty message when there are no choices', () => {
    const result = toChatResponse(makeResponse({ choices: [] }))
    expect(result.output).toEqual([{ type: 'message', content: '' }])
  })
})

describe('unsloth provider toDownloadStatus', () => {
  const startedAt = new Date(Date.now() - 10000).toISOString()

  it('takes the byte counts from the progress response', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'running', error: null, generation: 3 },
      { downloaded_bytes: 589173, expected_bytes: 396705472, progress: 0.001 },
      startedAt
    )
    expect(result).toMatchObject({
      job_id: 'job-1',
      status: 'downloading',
      downloaded_bytes: 589173,
      total_size_bytes: 396705472
    })
  })

  it('derives a transfer rate from the elapsed time', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'running' },
      { downloaded_bytes: 1000 },
      startedAt
    )
    expect(result.bytes_per_second).toBe(100)
  })

  it('stays downloading with no progress body at all', () => {
    const result = toDownloadStatus('job-1', { state: 'running' }, undefined, startedAt)
    expect(result.status).toBe('downloading')
    expect(result.total_size_bytes).toBeUndefined()
  })

  it('completes on the complete state', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'complete', error: null, generation: 3 },
      {
        downloaded_bytes: 396705472,
        expected_bytes: 396705472,
        complete_on_disk: true,
        progress: 1
      },
      startedAt
    )
    expect(result.status).toBe('completed')
    expect(result.downloaded_bytes).toBe(396705472)
    expect(result.completed_at).toBeDefined()
  })

  it('completes when the files are already on disk', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'idle' },
      { complete_on_disk: true, expected_bytes: 400 },
      startedAt
    )
    expect(result.status).toBe('completed')
    expect(result.downloaded_bytes).toBe(400)
  })

  it('treats an idle state with nothing on disk as still downloading', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'idle', error: null, generation: 0 },
      { downloaded_bytes: 0, expected_bytes: 0, complete_on_disk: false },
      startedAt
    )
    expect(result.status).toBe('downloading')
  })

  it('fails on an error message even while the state still reads running', () => {
    const result = toDownloadStatus(
      'job-1',
      { state: 'running', error: 'disk full' },
      {},
      startedAt
    )
    expect(result.status).toBe('failed')
  })

  it('maps failed and cancelled states to failed', () => {
    expect(toDownloadStatus('job-1', { state: 'failed' }, {}, startedAt).status).toBe('failed')
    expect(toDownloadStatus('job-1', { state: 'cancelled' }, {}, startedAt).status).toBe('failed')
  })

  it('maps a paused download', () => {
    expect(toDownloadStatus('job-1', { state: 'paused' }, {}, startedAt).status).toBe('paused')
  })
})

describe('unsloth provider toProviderError', () => {
  it('reads a string detail', () => {
    const error = toProviderError(404, 'Not Found', { detail: 'Model not found in cache' })
    expect(error.message).toBe('Model not found in cache')
    expect(error.status).toBe(404)
  })

  it('joins validation detail entries', () => {
    const error = toProviderError(422, 'Unprocessable', {
      detail: [{ msg: 'field required' }, { msg: 'invalid variant' }]
    })
    expect(error.message).toBe('field required, invalid variant')
  })

  it('falls back to the status text when the body has no detail', () => {
    expect(toProviderError(500, 'Internal Server Error', undefined).message).toBe(
      'Internal Server Error'
    )
  })
})
