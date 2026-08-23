import { describe, it, expect } from 'vitest'
import { isHuggingFaceUrl, toHuggingFaceModelId, toHuggingFaceModelUrl } from './huggingface-model'

describe('toHuggingFaceModelId', () => {
  it('keeps a bare publisher/model id', () => {
    expect(toHuggingFaceModelId('bartowski/Llama-3.2-3B-Instruct-GGUF')).toBe(
      'bartowski/Llama-3.2-3B-Instruct-GGUF'
    )
  })

  it('extracts the id from model card and file URLs', () => {
    expect(toHuggingFaceModelId('https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF')).toBe(
      'ggml-org/gemma-3-4b-it-GGUF'
    )

    expect(
      toHuggingFaceModelId('https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF/tree/main')
    ).toBe('ggml-org/gemma-3-4b-it-GGUF')

    expect(toHuggingFaceModelId('hf.co/ggml-org/gemma-3-4b-it-GGUF?library=true')).toBe(
      'ggml-org/gemma-3-4b-it-GGUF'
    )
  })

  it('drops a leading models path segment', () => {
    expect(toHuggingFaceModelId('https://huggingface.co/models/ggml-org/gemma-3-4b-it-GGUF')).toBe(
      'ggml-org/gemma-3-4b-it-GGUF'
    )
  })

  it('returns null when there is no publisher and model pair', () => {
    expect(toHuggingFaceModelId('')).toBeNull()
    expect(toHuggingFaceModelId('gemma-3-4b')).toBeNull()
    expect(toHuggingFaceModelId('https://huggingface.co/models')).toBeNull()
  })
})

describe('isHuggingFaceUrl', () => {
  it('recognises huggingface hosts with or without a scheme', () => {
    expect(isHuggingFaceUrl('https://huggingface.co/a/b')).toBe(true)
    expect(isHuggingFaceUrl('hf.co/a/b')).toBe(true)
    expect(isHuggingFaceUrl('a/b')).toBe(false)
    expect(isHuggingFaceUrl('https://ollama.com/library/qwen3')).toBe(false)
    expect(isHuggingFaceUrl('')).toBe(false)
    expect(isHuggingFaceUrl(null as unknown as string)).toBe(false)
  })
})

describe('toHuggingFaceModelUrl', () => {
  it('builds the model card URL', () => {
    expect(toHuggingFaceModelUrl('a/b')).toBe('https://huggingface.co/a/b')
  })
})
