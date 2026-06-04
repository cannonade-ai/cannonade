import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EvaluationConfig } from '@shared/app/test-suite'

vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn()
}))

function embed(...values: number[]): { data: Float32Array } {
  return { data: new Float32Array(values) }
}

describe('runCosineSimilarity', () => {
  const base: EvaluationConfig = { type: 'cosine_similarity' }

  beforeEach(() => {
    vi.resetModules()
  })

  async function setup(
    outputEmb: ReturnType<typeof embed>,
    expectedEmb: ReturnType<typeof embed>
  ): Promise<unknown> {
    const { pipeline } = await import('@huggingface/transformers')
    const mockExtractor = vi
      .fn()
      .mockResolvedValueOnce(outputEmb)
      .mockResolvedValueOnce(expectedEmb)
    vi.mocked(pipeline).mockResolvedValue(mockExtractor as never)
    const { runCosineSimilarity } = await import('./cosineSimilarity')
    return runCosineSimilarity
  }

  it('returns error when expected is missing', async () => {
    const { runCosineSimilarity } = await import('./cosineSimilarity')
    const result = await runCosineSimilarity('some output', { ...base })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when expected is empty string', async () => {
    const { runCosineSimilarity } = await import('./cosineSimilarity')
    const result = await runCosineSimilarity('some output', { ...base, expected: '' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns error when output is empty', async () => {
    const { runCosineSimilarity } = await import('./cosineSimilarity')
    const result = await runCosineSimilarity('', { ...base, expected: 'some expected' })
    expect(result.passed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns score 1 for identical embeddings', async () => {
    const fn = await setup(embed(1, 0, 0), embed(1, 0, 0))
    const result = await fn('text', { ...base, expected: 'text' })
    expect(result.score).toBe(1)
    expect(result.passed).toBe(true)
  })

  it('returns score 0 for orthogonal embeddings', async () => {
    const fn = await setup(embed(1, 0), embed(0, 1))
    const result = await fn('output', { ...base, expected: 'expected' })
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('returns partial score for partially similar embeddings', async () => {
    // [1,0] · [0.6, 0.8] = 0.6, both unit vectors
    const fn = await setup(embed(1, 0), embed(0.6, 0.8))
    const result = await fn('output', { ...base, expected: 'expected' })
    expect(result.score).toBe(0.6)
    expect(result.passed).toBe(false)
  })

  it('passes when score meets the default threshold of 0.8', async () => {
    // [1,0] · [0.8, 0.6] = 0.8, both unit vectors
    const fn = await setup(embed(1, 0), embed(0.8, 0.6))
    const result = await fn('output', { ...base, expected: 'expected' })
    expect(result.score).toBe(0.8)
    expect(result.passed).toBe(true)
  })

  it('respects a custom threshold', async () => {
    const fn = await setup(embed(1, 0), embed(0.6, 0.8))
    const result = await fn('output', { ...base, threshold: 0.5, expected: 'expected' })
    expect(result.score).toBe(0.6)
    expect(result.passed).toBe(true)
  })

  it('clamps score to 4 decimal places', async () => {
    // [1,0,0] · [1/√3, 1/√3, 1/√3] = 1/√3 ≈ 0.5774
    const v = 1 / Math.sqrt(3)
    const fn = await setup(embed(1, 0, 0), embed(v, v, v))
    const result = await fn('output', { ...base, expected: 'expected' })
    expect(result.score).toBe(parseFloat((1 / Math.sqrt(3)).toFixed(4)))
  })

  it('returns error when the extractor throws', async () => {
    const { pipeline } = await import('@huggingface/transformers')
    const mockExtractor = vi.fn().mockRejectedValue(new Error('model load failed'))
    vi.mocked(pipeline).mockResolvedValue(mockExtractor as any)
    const { runCosineSimilarity } = await import('./cosineSimilarity')
    const result = await runCosineSimilarity('output', { ...base, expected: 'expected' })
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.error).toMatch(/cosine similarity error/i)
  })
})
