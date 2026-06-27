export interface ProviderCapabilities {
  chat: boolean
  localModels: boolean
  externalModels: boolean
  downloadModel: boolean
  downloadStatus: boolean
  deleteModel: boolean
  loadModel: boolean
  serverControl: boolean
  requiresApiKey: boolean
  modelRegistryUrl?: string
  huggingFaceModelsUrl?: string
}
