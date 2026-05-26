export interface ExternalModel {
  id: string
  name: string
  providerId: string
  contextLength: number
  meta: Record<string, unknown>
}
