import { readFile, rm } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { exec } from 'child_process'
import { ProviderError, type LLMProvider } from './base'
import type { LocalModel } from '@shared/provider/local-model'
import type {
  Model,
  DownloadModelResponse,
  DownloadStatusResponse,
  ServerStatusResponse
} from '@shared/lm-studio/ipc-contracts'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

interface LmStudioErrorBody {
  message: string
  type?: string
  code?: string
  param?: string
}

function parseError(raw: string, status: number): ProviderError {
  try {
    const parsed = JSON.parse(raw) as { error?: LmStudioErrorBody }
    const err = parsed.error
    if (err) {
      const parts = [err.message]
      if (err.type) parts.push(`type: ${err.type}`)
      if (err.code) parts.push(`code: ${err.code}`)
      if (err.param) parts.push(`param: ${err.param}`)
      return new ProviderError(parts.join(' | '), status, err.code)
    }
  } catch {
    //
  }
  return new ProviderError(`HTTP ${status}`, status)
}

async function fetchOrThrow(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const raw = await res.text()
    console.error(`[lmstudio] ${init?.method ?? 'GET'} ${input} error:`, raw)
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
  remote = false
): LLMProvider {
  const base = url.replace(/\/$/, '')

  async function fetchRawModels(): Promise<Model[]> {
    const res = await fetchOrThrow(`${base}/api/v1/models`)
    const data = (await res.json()) as { models: Model[] }
    return data.models
  }

  function mapToLocalModel(model: Model): LocalModel {
    const meta: Record<string, string | number> = {}
    if (model.publisher) meta.publisher = model.publisher
    if (model.architecture) meta.architecture = model.architecture
    if (model.quantization?.name) meta.quantization = model.quantization.name
    if (model.params_string) meta.params_string = model.params_string
    if (model.format) meta.format = model.format

    return {
      id: model.key,
      name: model.display_name,
      providerId: instanceId,
      sizeBytes: model.size_bytes,
      type: model.type,
      loadedInstances: model.loaded_instances.map((i) => ({
        id: i.id,
        config: { context_length: i.config.context_length }
      })),
      capabilities: model.capabilities,
      maxContextLength: model.max_context_length,
      meta
    }
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
      requiresApiKey: false
    },

    async fetchLocalModels(): Promise<LocalModel[]> {
      return (await fetchRawModels()).map(mapToLocalModel)
    },

    async chat(modelId: string, request: ChatRequest): Promise<ChatResponse> {
      const body = { ...request, model: modelId }
      console.log('[lmstudio] chat body:', JSON.stringify(body, null, 2))
      const res = await fetchOrThrow(`${base}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      return res.json() as Promise<ChatResponse>
    },

    async downloadModel(downloadUrl: string): Promise<DownloadModelResponse> {
      const res = await fetchOrThrow(`${base}/api/v1/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: downloadUrl })
      })
      return res.json() as Promise<DownloadModelResponse>
    },

    async getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> {
      const res = await fetchOrThrow(`${base}/api/v1/models/download/status/${jobId}`)
      return res.json() as Promise<DownloadStatusResponse>
    },

    async deleteModel(modelId: string): Promise<void> {
      const models = await fetchRawModels()
      const model = models.find((m) => m.key === modelId)
      if (!model) throw new Error(`Model not found: ${modelId}`)
      const lmSettingsPath = join(homedir(), '.lmstudio', 'settings.json')
      const raw = await readFile(lmSettingsPath, 'utf-8')
      const lmSettings = JSON.parse(raw) as { downloadsFolder: string }
      const folderName = `${model.key}-${(model.format ?? '').toUpperCase()}`
      const modelPath = join(lmSettings.downloadsFolder, model.publisher, folderName)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId })
      })
    },

    async unloadModel(loadedInstanceId: string): Promise<void> {
      await fetchOrThrow(`${base}/api/v1/models/unload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: loadedInstanceId })
      })
    },

    async getServerStatus(): Promise<ServerStatusResponse> {
      const output = await execCommand('lms server status')
      const portMatch = output.match(/port (\d+)/)
      return {
        running: output.toLowerCase().includes('is running'),
        port: portMatch ? Number(portMatch[1]) : null
      }
    },

    async startServer(): Promise<ServerStatusResponse> {
      const output = await execCommand('lms server start')
      const portMatch = output.match(/port (\d+)/)
      return {
        running: output.toLowerCase().includes('running'),
        port: portMatch ? Number(portMatch[1]) : null
      }
    },

    async stopServer(): Promise<ServerStatusResponse> {
      const output = await execCommand('lms server stop')
      return {
        running: !output.toLowerCase().includes('stopped'),
        port: null
      }
    }
  }

  return provider
}
