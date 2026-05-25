import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { LocalModel } from '@shared/provider/local-model'
import type { ExternalModel } from '@shared/provider/external-model'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/lm-studio/ipc-contracts'

export interface LLMProvider {
  readonly id: string
  readonly capabilities: ProviderCapabilities
  fetchLocalModels?(): Promise<LocalModel[]>
  fetchExternalModels?(): Promise<ExternalModel[]>
  chat?(modelId: string, request: ChatRequest): Promise<ChatResponse>
  downloadModel?(url: string): Promise<DownloadModelResponse>
  getDownloadStatus?(jobId: string): Promise<DownloadStatusResponse>
  deleteModel?(modelId: string): Promise<void>
  deleteModelByHfId?(hfModelId: string): Promise<void>
  loadModel?(modelId: string): Promise<void>
  unloadModel?(instanceId: string): Promise<void>
  getServerStatus?(): Promise<ServerStatusResponse>
  startServer?(): Promise<ServerStatusResponse>
  stopServer?(): Promise<ServerStatusResponse>
}
