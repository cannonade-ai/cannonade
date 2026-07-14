import { describe, it, expect } from 'vitest'
import { isMultimodal, supportsTextOutput } from './external-model'
import type { ExternalModel } from './external-model'

function makeModel(inputModalities?: string[], outputModalities?: string[]): ExternalModel {
  return {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    publisher: 'openai',
    providerId: 'openrouter-1',
    contextLength: 8192,
    ...(inputModalities ? { inputModalities } : {}),
    ...(outputModalities ? { outputModalities } : {})
  }
}

describe('isMultimodal', () => {
  it('returns false for text-only models', () => {
    expect(isMultimodal(makeModel(['text'], ['text']))).toBe(false)
  })

  it('returns false when modalities are unknown', () => {
    expect(isMultimodal(makeModel())).toBe(false)
  })

  it('returns true for non-text inputs', () => {
    expect(isMultimodal(makeModel(['text', 'image'], ['text']))).toBe(true)
  })

  it('returns true for non-text outputs', () => {
    expect(isMultimodal(makeModel(['text'], ['image']))).toBe(true)
  })
})

describe('supportsTextOutput', () => {
  it('accepts models that output text', () => {
    expect(supportsTextOutput(makeModel(['text'], ['text']))).toBe(true)
  })

  it('accepts models with unknown output modalities', () => {
    expect(supportsTextOutput(makeModel())).toBe(true)
  })

  it('rejects models that only output images', () => {
    expect(supportsTextOutput(makeModel(['text'], ['image']))).toBe(false)
  })

  it('accepts multimodal models that also output text', () => {
    expect(supportsTextOutput(makeModel(['text'], ['text', 'audio']))).toBe(true)
  })
})
