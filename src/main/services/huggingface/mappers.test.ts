import { describe, it, expect } from 'vitest'
import { toQuantOptions, toModelDetails } from './mappers'
import type { HuggingFaceModelResponse, HuggingFaceSibling } from './types'

function sibling(rfilename: string, size: number): HuggingFaceSibling {
  return { rfilename, lfs: { size } }
}

describe('toQuantOptions', () => {
  it('reads the quantization from gguf file names and sorts by size', () => {
    const result = toQuantOptions([
      sibling('README.md', 100),
      sibling('Llama-3.2-3B-Instruct-Q8_0.gguf', 3_000),
      sibling('Llama-3.2-3B-Instruct-Q4_K_M.gguf', 2_000),
      sibling('Llama-3.2-3B-Instruct-IQ3_M.gguf', 1_000)
    ])

    expect(result.map((q) => q.label)).toEqual(['IQ3_M', 'Q4_K_M', 'Q8_0'])
    expect(result[1].sizeBytes).toBe(2_000)
  })

  it('ignores non-gguf files and names without a quantization token', () => {
    const result = toQuantOptions([
      sibling('config.json', 10),
      sibling('model.safetensors', 20),
      sibling('Qwen3-4B.gguf', 30)
    ])

    expect(result).toEqual([])
  })

  it('merges sharded files into a single option with the summed size', () => {
    const result = toQuantOptions([
      sibling('Qwen3-235B-A22B-Q4_K_M-00001-of-00002.gguf', 1_500),
      sibling('Qwen3-235B-A22B-Q4_K_M-00002-of-00002.gguf', 500)
    ])

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Q4_K_M')
    expect(result[0].sizeBytes).toBe(2_000)
    expect(result[0].fileNames).toHaveLength(2)
  })

  it('reads quantizations from subfolder names and dot separators', () => {
    const result = toQuantOptions([
      sibling('Q6_K/model-00001-of-00001.gguf', 600),
      sibling('Meta-Llama-3-8B-Instruct.Q4_0.gguf', 400)
    ])

    expect(result.map((q) => q.label)).toEqual(['Q4_0', 'Q6_K'])
  })

  it('falls back to the plain size when there is no lfs entry', () => {
    const result = toQuantOptions([{ rfilename: 'tiny-Q2_K.gguf', size: 42 }])

    expect(result[0].sizeBytes).toBe(42)
  })
})

describe('toModelDetails', () => {
  const response: HuggingFaceModelResponse = {
    id: 'bartowski/Llama-3.2-3B-Instruct-GGUF',
    author: 'bartowski',
    pipeline_tag: 'text-generation',
    tags: ['gguf', 'llama'],
    downloads: 1234,
    likes: 56,
    lastModified: '2025-01-02T03:04:05.000Z',
    gguf: { architecture: 'llama', context_length: 131072 },
    siblings: [sibling('Llama-3.2-3B-Instruct-Q4_K_M.gguf', 2_000)]
  }

  it('maps the response onto the shared details shape', () => {
    const result = toModelDetails(response)

    expect(result).toMatchObject({
      modelId: 'bartowski/Llama-3.2-3B-Instruct-GGUF',
      author: 'bartowski',
      task: 'text-generation',
      downloadCount: 1234,
      likeCount: 56,
      architecture: 'llama',
      contextLength: 131072,
      isGated: false
    })
    expect(result.quantOptions.map((q) => q.label)).toEqual(['Q4_K_M'])
  })

  it('treats any non-false gated value as gated', () => {
    expect(toModelDetails({ ...response, gated: 'auto' }).isGated).toBe(true)
    expect(toModelDetails({ ...response, gated: false }).isGated).toBe(false)
  })

  it('falls back to the id prefix when the author is missing', () => {
    expect(toModelDetails({ ...response, author: undefined }).author).toBe('bartowski')
  })
})
