import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/provider/ipc-contracts'

export class ProviderError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
    this.code = code
  }
}

export interface LLMProvider {
  readonly id: string
  readonly capabilities: ProviderCapabilities
  fetchLocalModels?(): Promise<LocalModel[]>
  fetchExternalModels?(): Promise<ExternalModel[]>
  chat?(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse>
  downloadModel?(url: string, quantization?: string): Promise<DownloadModelResponse>
  getDownloadStatus?(jobId: string): Promise<DownloadStatusResponse>
  deleteModel?(modelId: string): Promise<void>
  deleteModelByHfId?(hfModelId: string): Promise<void>
  loadModel?(modelId: string): Promise<void>
  unloadModel?(instanceId: string): Promise<void>
  getServerStatus?(): Promise<ServerStatusResponse>
  startServer?(): Promise<ServerStatusResponse>
  stopServer?(): Promise<ServerStatusResponse>
}
