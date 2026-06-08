import { Ollama } from 'ollama'
import type { LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse } from '@shared/provider/chat'
import type { DownloadModelResponse, DownloadStatusResponse } from '@shared/provider/ipc-contracts'

import { toLocalModel, toChatRequest, toChatResponse, toDownloadProgress } from './mappers'

export function createOllamaProvider(instanceId: string, url: string): LLMProvider {
  const client = new Ollama({ host: url })
  const downloadJobs = new Map<string, DownloadStatusResponse>()

  return {
    id: instanceId,

    capabilities: {
      chat: true,
      localModels: true,
      externalModels: false,
      downloadModel: true,
      downloadStatus: true,
      deleteModel: true,
      loadModel: true,
      serverControl: false,
      requiresApiKey: false
    },

    async fetchLocalModels(): Promise<LocalModel[]> {
      const [listRes, psRes] = await Promise.all([client.list(), client.ps()])
      return listRes.models.map((m) => toLocalModel(m, psRes.models, instanceId))
    },

    async chat(request: ChatRequest): Promise<ChatResponse> {
      const ollamaRequest = toChatRequest(request)
      console.log('[ollama] chat body:', JSON.stringify(ollamaRequest, null, 2))
      const response = await client.chat(ollamaRequest)
      return toChatResponse(response)
    },

    async deleteModel(modelId: string): Promise<void> {
      await client.delete({ model: modelId })
    },

    async downloadModel(modelName: string): Promise<DownloadModelResponse> {
      const jobId = crypto.randomUUID()
      downloadJobs.set(jobId, { job_id: jobId, status: 'downloading' })

      void (async () => {
        try {
          const stream = await client.pull({ model: modelName, stream: true })
          for await (const chunk of stream) {
            downloadJobs.set(jobId, toDownloadProgress(jobId, chunk))
          }
          downloadJobs.set(jobId, { job_id: jobId, status: 'completed' })
        } catch {
          downloadJobs.set(jobId, { job_id: jobId, status: 'failed' })
        }
      })()

      return { job_id: jobId, status: 'downloading' }
    },

    async getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> {
      return downloadJobs.get(jobId) ?? { job_id: jobId, status: 'failed' }
    },

    async loadModel(modelId: string): Promise<void> {
      await client.generate({ model: modelId, prompt: '', keep_alive: '1h' })
    },

    async unloadModel(loadedInstanceId: string): Promise<void> {
      await client.generate({ model: loadedInstanceId, prompt: '', keep_alive: 0 })
      await new Promise<void>((resolve) => setTimeout(resolve, 3000))
    }
  }
}
