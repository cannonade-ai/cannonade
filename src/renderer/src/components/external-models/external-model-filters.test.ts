import { describe, expect, it } from 'vitest'
import type { ExternalModel } from '@shared/provider/external-model'
import {
  ANY_MODALITY,
  collectModalities,
  createModelComparator,
  matchesModality,
  matchesQuery
} from './external-model-filters'

function makeModel(overrides: Partial<ExternalModel> = {}): ExternalModel {
  return {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    publisher: 'openai',
    providerId: 'openrouter',
    contextLength: 8000,
    ...overrides
  }
}

describe('matchesModality', () => {
  it('accepts everything when the filter is any', () => {
    expect(matchesModality(['image'], ANY_MODALITY)).toBe(true)
    expect(matchesModality(undefined, ANY_MODALITY)).toBe(true)
  })

  it('matches a listed modality', () => {
    expect(matchesModality(['text', 'image', 'file'], 'file')).toBe(true)
    expect(matchesModality(['text', 'image'], 'audio')).toBe(false)
  })

  it('treats missing modalities as text', () => {
    expect(matchesModality(undefined, 'text')).toBe(true)
    expect(matchesModality([], 'text')).toBe(true)
    expect(matchesModality(undefined, 'image')).toBe(false)
  })
})

describe('matchesQuery', () => {
  it('matches name, id, and publisher', () => {
    const model = makeModel()
    expect(matchesQuery(model, 'gpt-4')).toBe(true)
    expect(matchesQuery(model, 'openai/')).toBe(true)
    expect(matchesQuery(model, 'openai')).toBe(true)
    expect(matchesQuery(model, 'claude')).toBe(false)
  })

  it('matches everything on an empty query', () => {
    expect(matchesQuery(makeModel(), '')).toBe(true)
  })
})

describe('createModelComparator', () => {
  const cheap = makeModel({
    id: 'a',
    name: 'Cheap',
    pricing: { inputPerMTokens: 1, outputPerMTokens: 9 }
  })
  const pricey = makeModel({
    id: 'b',
    name: 'Pricey',
    pricing: { inputPerMTokens: 5, outputPerMTokens: 2 }
  })
  const unpriced = makeModel({ id: 'c', name: 'Unpriced' })

  function sortBy(direction: 'asc' | 'desc'): string[] {
    return [pricey, unpriced, cheap]
      .sort(createModelComparator('input-price', direction))
      .map((m) => m.name)
  }

  it('sorts input price ascending', () => {
    expect(sortBy('asc')).toEqual(['Cheap', 'Pricey', 'Unpriced'])
  })

  it('sorts input price descending', () => {
    expect(sortBy('desc')).toEqual(['Pricey', 'Cheap', 'Unpriced'])
  })

  it('keeps models without a value last in both directions', () => {
    expect(sortBy('asc').at(-1)).toBe('Unpriced')
    expect(sortBy('desc').at(-1)).toBe('Unpriced')
  })

  it('sorts output price independently of input price', () => {
    const names = [cheap, pricey]
      .sort(createModelComparator('output-price', 'asc'))
      .map((m) => m.name)
    expect(names).toEqual(['Pricey', 'Cheap'])
  })

  it('sorts names in both directions', () => {
    expect([pricey, cheap].sort(createModelComparator('name', 'asc')).map((m) => m.name)).toEqual([
      'Cheap',
      'Pricey'
    ])
    expect([cheap, pricey].sort(createModelComparator('name', 'desc')).map((m) => m.name)).toEqual([
      'Pricey',
      'Cheap'
    ])
  })

  it('sorts release date newest first when descending', () => {
    const old = makeModel({ id: 'old', name: 'Old', createdAt: 100 })
    const recent = makeModel({ id: 'new', name: 'New', createdAt: 200 })
    expect([old, recent].sort(createModelComparator('created', 'desc')).map((m) => m.name)).toEqual(
      ['New', 'Old']
    )
  })

  it('falls back to name for equal values', () => {
    const a = makeModel({ id: 'x', name: 'Alpha', contextLength: 1000 })
    const b = makeModel({ id: 'y', name: 'Beta', contextLength: 1000 })
    expect([b, a].sort(createModelComparator('context', 'desc')).map((m) => m.name)).toEqual([
      'Alpha',
      'Beta'
    ])
  })
})

describe('collectModalities', () => {
  it('returns unique modalities in declaration order', () => {
    const models = [
      makeModel({ id: 'a', inputModalities: ['image', 'text'] }),
      makeModel({ id: 'b', inputModalities: ['file'] }),
      makeModel({ id: 'c' })
    ]
    expect(collectModalities(models, (m) => m.inputModalities)).toEqual(['text', 'image', 'file'])
  })

  it('sorts unknown modalities last', () => {
    const models = [makeModel({ id: 'a', outputModalities: ['weird', 'text'] })]
    expect(collectModalities(models, (m) => m.outputModalities)).toEqual(['text', 'weird'])
  })
})
