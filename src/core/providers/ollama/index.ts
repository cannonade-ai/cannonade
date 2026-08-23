import { Ollama } from 'ollama'
import type { ChatResponse as OllamaChatResponse } from 'ollama'
import { ProviderError, type LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/provider/ipc-contracts'

import { authHeader } from '@shared/provider/api-key'
import {
  toLocalModel,
  toChatRequest,
  toChatResponse,
  toDownloadProgress,
  toPullTarget
} from './mappers'
import {
  isManagedProcess,
  startManagedProcess,
  stopManagedProcess
} from '../../../main/services/managed-process'
import { createLogger } from '../../../main/logger'

const log = createLogger('ollama')

const START_TIMEOUT_MS = 30000
const STOP_TIMEOUT_MS = 10000
const PROBE_INTERVAL_MS = 500

export function createOllamaProvider(
  instanceId: string,
  url: string,
  apiKey?: string,
  remote = false
): LLMProvider {
  const client = new Ollama({ host: url, headers: authHeader(apiKey) })
  const downloadJobs = new Map<string, DownloadStatusResponse>()

  async function isServerReachable(): Promise<boolean> {
    try {
      await client.list()
      return true
    } catch (err) {
      log.debug(`Server probe failed for ${url}:`, err)
      return false
    }
  }

  async function waitForReachable(expected: boolean, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if ((await isServerReachable()) === expected) return true
      await new Promise<void>((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS))
    }
    return isServerReachable()
  }

  function toStatus(running: boolean): ServerStatusResponse {
    return { running, port: null, managed: running && isManagedProcess(instanceId) }
  }

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
      serverControl: !remote,
      processLevelServerControl: true,
      requiresApiKey: false,
      modelRegistryUrl: 'https://ollama.com/library',
      huggingFaceModelsUrl: 'https://huggingface.co/models?apps=ollama'
    },

    async fetchLocalModels(): Promise<LocalModel[]> {
      const [listRes, psRes] = await Promise.all([client.list(), client.ps()])
      return listRes.models.map((m) => toLocalModel(m, psRes.models, instanceId))
    },

    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
      const ollamaRequest = toChatRequest(request)
      log.debug('Chat request body:', ollamaRequest)
      const stream = await client.chat(ollamaRequest)

      const onAbort = (): void => stream.abort()
      options?.abortSignal?.addEventListener('abort', onAbort)

      try {
        let content = ''
        let thinking = ''
        let finalChunk: OllamaChatResponse | undefined
        for await (const chunk of stream) {
          content += chunk.message.content
          if (chunk.message.thinking) thinking += chunk.message.thinking
          finalChunk = chunk
        }
        if (!finalChunk) throw new Error('[ollama] chat stream ended without a response')
        return toChatResponse(finalChunk, content, thinking)
      } finally {
        options?.abortSignal?.removeEventListener('abort', onAbort)
      }
    },

    async deleteModel(modelId: string): Promise<void> {
      await client.delete({ model: modelId })
    },

    async downloadModel(
      downloadTarget: string,
      quantization?: string
    ): Promise<DownloadModelResponse> {
      const modelName = toPullTarget(downloadTarget, quantization)
      log.debug(`Download target "${downloadTarget}" resolved to "${modelName}"`)
      const jobId = crypto.randomUUID()
      downloadJobs.set(jobId, { job_id: jobId, status: 'downloading' })

      void (async () => {
        try {
          const stream = await client.pull({ model: modelName, stream: true })
          for await (const chunk of stream) {
            downloadJobs.set(jobId, toDownloadProgress(jobId, chunk))
          }
          downloadJobs.set(jobId, { job_id: jobId, status: 'completed' })
        } catch (err) {
          log.error(`Download failed for model ${modelName}:`, err)
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
    },

    async getServerStatus(): Promise<ServerStatusResponse> {
      return toStatus(await isServerReachable())
    },

    async startServer(): Promise<ServerStatusResponse> {
      if (await isServerReachable()) {
        log.info(`Ollama server already reachable at ${url}, nothing to start`)
        return toStatus(true)
      }

      try {
        await startManagedProcess(instanceId, 'ollama', ['serve'], {
          OLLAMA_HOST: new URL(url).host
        })
      } catch (err) {
        log.error('Failed to spawn ollama serve:', err)
        throw new ProviderError(
          'Could not start Ollama. Make sure Ollama is installed and on your PATH.',
          500
        )
      }

      if (!(await waitForReachable(true, START_TIMEOUT_MS))) {
        await stopManagedProcess(instanceId)
        throw new ProviderError(`Ollama server did not become reachable at ${url}`, 504, 'timeout')
      }

      return toStatus(true)
    },

    async stopServer(): Promise<ServerStatusResponse> {
      if (!isManagedProcess(instanceId)) {
        throw new ProviderError(
          'This Ollama server was not started by Cannonade, so it cannot be stopped from here.',
          409
        )
      }

      await stopManagedProcess(instanceId)
      await waitForReachable(false, STOP_TIMEOUT_MS)
      return toStatus(await isServerReachable())
    }
  }
}
