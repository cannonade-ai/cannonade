import { readFile, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { LMStudioClient } from '@lmstudio/sdk'
import { join } from 'path'
import { homedir } from 'os'
import { exec } from 'child_process'
import { ProviderError, type LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type {
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/provider/ipc-contracts'
import type { ErrorBody, LmStudioSettings, ModelListResponse, Model } from './types'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import { authHeader } from '@shared/provider/api-key'
import {
  toLocalModel,
  toChatRequest,
  parseStatusOutput,
  parseStartOutput,
  parseStopOutput
} from './mappers'
import { createLogger } from '../../../main/logger'

const log = createLogger('lmstudio')

function parseError(raw: string, status: number): ProviderError {
  try {
    const parsed = JSON.parse(raw) as { error?: ErrorBody }
    const err = parsed.error
    if (err) {
      const parts = [err.message]
      if (err.type) parts.push(`type: ${err.type}`)
      if (err.code) parts.push(`code: ${err.code}`)
      if (err.param) parts.push(`param: ${err.param}`)
      return new ProviderError(parts.join(' | '), status, err.code)
    }
  } catch (e) {
    log.debug('Error response body is not JSON:', e)
  }
  return new ProviderError(`HTTP ${status}`, status)
}

async function fetchOrThrow(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const raw = await res.text()
    log.error(`${init?.method ?? 'GET'} ${input} error:`, raw)
    throw parseError(raw, res.status)
  }
  return res
}

function execCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, (_err, stdout, stderr) => {
      resolve((stdout || stderr).trim())
    })
  })
}

export function createLmStudioProvider(
  instanceId: string,
  url: string,
  apiKey?: string,
  remote = false
): LLMProvider {
  const base = url.replace(/\/$/, '')
  const auth = authHeader(apiKey)

  let sdkClient: LMStudioClient | null = null
  function getSdkClient(): LMStudioClient {
    if (!sdkClient) sdkClient = new LMStudioClient({ baseUrl: `ws://${new URL(base).host}` })
    return sdkClient
  }

  async function fetchRawModels(): Promise<Model[]> {
    const res = await fetchOrThrow(`${base}/api/v1/models`, { headers: { ...auth } })
    return ((await res.json()) as ModelListResponse).models
  }

  const provider: LLMProvider = {
    id: instanceId,

    capabilities: {
      chat: true,
      localModels: true,
      externalModels: false,
      downloadModel: true,
      downloadStatus: true,
      deleteModel: !remote,
      loadModel: true,
      serverControl: !remote,
      requiresApiKey: false,
      modelRegistryUrl: 'https://lmstudio.ai/models',
      huggingFaceModelsUrl: 'https://huggingface.co/models?apps=lmstudio'
    },

    async fetchLocalModels(): Promise<LocalModel[]> {
      return (await fetchRawModels()).map((m) => toLocalModel(m, instanceId))
    },

    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> {
      const body = toChatRequest(request)
      log.debug('Chat request body:', body)
      const res = await fetchOrThrow(`${base}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(body),
        signal: options?.abortSignal
      })
      return (await res.json()) as ChatResponse
    },

    async downloadModel(downloadUrl: string): Promise<DownloadModelResponse> {
      const res = await fetchOrThrow(`${base}/api/v1/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ model: downloadUrl })
      })
      return res.json() as Promise<DownloadModelResponse>
    },

    async getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> {
      const res = await fetchOrThrow(`${base}/api/v1/models/download/status/${jobId}`, {
        headers: { ...auth }
      })
      return res.json() as Promise<DownloadStatusResponse>
    },

    async deleteModel(modelId: string): Promise<void> {
      const lmSettingsPath = join(homedir(), '.lmstudio', 'settings.json')
      const raw = await readFile(lmSettingsPath, 'utf-8')
      const lmSettings = JSON.parse(raw) as LmStudioSettings

      const downloaded = await getSdkClient().system.listDownloadedModels()
      const match = downloaded.find((m) => m.modelKey === modelId)
      if (!match) throw new ProviderError(`Model not found: ${modelId}`, 404)

      const modelPath = join(lmSettings.downloadsFolder, match.path)
      if (!existsSync(modelPath)) {
        throw new ProviderError(
          `Cannot delete "${modelId}": files not found on disk. Note: LM Studio Hub models cannot be deleted from Cannonade.`,
          400
        )
      }

      await rm(modelPath, { recursive: true, force: true })
    },

    async deleteModelByHfId(hfModelId: string): Promise<void> {
      const [pub, modelName] = hfModelId.split('/')
      const normalizedModelName = modelName.toLowerCase().replace(/-gguf$/, '')
      const models = await fetchRawModels()
      const matching = models.filter(
        (m) =>
          m.publisher.toLowerCase() === pub.toLowerCase() &&
          m.key.toLowerCase() === normalizedModelName
      )
      await Promise.all(matching.map((m) => provider.deleteModel!(m.key)))
    },

    async loadModel(modelId: string): Promise<void> {
      await fetchOrThrow(`${base}/api/v1/models/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ model: modelId })
      })
    },

    async unloadModel(loadedInstanceId: string): Promise<void> {
      await fetchOrThrow(`${base}/api/v1/models/unload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ instance_id: loadedInstanceId })
      })
    },

    async getServerStatus(): Promise<ServerStatusResponse> {
      const output = await execCommand('lms server status')
      log.debug('lms server status output:', output)
      return parseStatusOutput(output)
    },

    async startServer(): Promise<ServerStatusResponse> {
      log.info('Starting LM Studio server')
      const output = await execCommand('lms server start')
      log.debug('lms server start output:', output)
      return parseStartOutput(output)
    },

    async stopServer(): Promise<ServerStatusResponse> {
      log.info('Stopping LM Studio server')
      const output = await execCommand('lms server stop')
      log.debug('lms server stop output:', output)
      return parseStopOutput(output)
    }
  }

  return provider
}
