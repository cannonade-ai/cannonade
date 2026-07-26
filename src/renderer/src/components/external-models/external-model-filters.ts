import { ModelModality } from '@shared/provider/external-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { SelectOption } from '@renderer/components/ui/Select.vue'

export type SortKey = 'created' | 'name' | 'input-price' | 'output-price' | 'context'
export type SortDirection = 'asc' | 'desc'

export const ANY_MODALITY = 'any'

export const sortOptions: SelectOption<SortKey>[] = [
  { value: 'created', label: 'Release date' },
  { value: 'name', label: 'Name' },
  { value: 'input-price', label: 'Input price' },
  { value: 'output-price', label: 'Output price' },
  { value: 'context', label: 'Context length' }
]

export const defaultSortDirections: Record<SortKey, SortDirection> = {
  created: 'desc',
  name: 'asc',
  'input-price': 'asc',
  'output-price': 'asc',
  context: 'desc'
}

const MODALITY_ORDER: string[] = Object.values(ModelModality)

const numericValues: Record<
  Exclude<SortKey, 'name'>,
  (model: ExternalModel) => number | undefined
> = {
  created: (model) => model.createdAt,
  'input-price': (model) => model.pricing?.inputPerMTokens,
  'output-price': (model) => model.pricing?.outputPerMTokens,
  context: (model) => model.contextLength
}

export function createModelComparator(
  key: SortKey,
  direction: SortDirection
): (a: ExternalModel, b: ExternalModel) => number {
  const sign = direction === 'asc' ? 1 : -1
  if (key === 'name') return (a, b) => sign * a.name.localeCompare(b.name)

  const value = numericValues[key]
  return (a, b) => {
    const left = value(a)
    const right = value(b)
    if (left === undefined && right === undefined) return a.name.localeCompare(b.name)
    if (left === undefined) return 1
    if (right === undefined) return -1
    return sign * (left - right) || a.name.localeCompare(b.name)
  }
}

export function modalitiesOf(modalities: string[] | undefined): string[] {
  return modalities && modalities.length > 0 ? modalities : [ModelModality.Text]
}

export function matchesModality(modalities: string[] | undefined, filter: string): boolean {
  if (filter === ANY_MODALITY) return true
  return modalitiesOf(modalities).includes(filter)
}

export function matchesQuery(model: ExternalModel, query: string): boolean {
  if (!query) return true
  return (
    model.name.toLowerCase().includes(query) ||
    model.id.toLowerCase().includes(query) ||
    model.publisher.toLowerCase().includes(query)
  )
}

export function collectModalities(
  models: ExternalModel[],
  pick: (model: ExternalModel) => string[] | undefined
): string[] {
  const found = new Set<string>()
  for (const model of models) {
    for (const modality of modalitiesOf(pick(model))) found.add(modality)
  }
  return [...found].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

function rank(modality: string): number {
  const index = MODALITY_ORDER.indexOf(modality)
  return index === -1 ? MODALITY_ORDER.length : index
}
