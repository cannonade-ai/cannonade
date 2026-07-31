export interface ExternalModelPricing {
  inputPerMTokens: number
  outputPerMTokens: number
  cacheReadPerMTokens?: number
}

export const ModelModality = {
  Text: 'text',
  Image: 'image',
  Audio: 'audio',
  File: 'file',
  Video: 'video',
  Embeddings: 'embeddings',
  Rerank: 'rerank',
  Speech: 'speech',
  Transcription: 'transcription'
} as const

export interface ExternalModel {
  id: string
  name: string
  publisher: string
  providerId: string
  description?: string
  contextLength: number
  maxOutputTokens?: number
  inputModalities?: string[]
  outputModalities?: string[]
  pricing?: ExternalModelPricing
  supportedParameters?: string[]
  createdAt?: number
  releasedAt?: number
  knowledgeCutoff?: string
  expirationDate?: string
  isModerated?: boolean
  raw?: Record<string, unknown>
}

export function isMultimodal(model: ExternalModel): boolean {
  const modalities = [...(model.inputModalities ?? []), ...(model.outputModalities ?? [])]
  return modalities.some((m) => m !== ModelModality.Text)
}

export function supportsTextOutput(model: ExternalModel): boolean {
  const outputs = model.outputModalities
  if (!outputs || outputs.length === 0) return true
  return outputs.includes(ModelModality.Text)
}
