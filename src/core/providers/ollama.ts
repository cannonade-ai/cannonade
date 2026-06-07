import { Ollama } from 'ollama'
import type { LLMProvider } from './base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'
import type { DownloadModelResponse, DownloadStatusResponse } from '@shared/lm-studio/ipc-contracts'

interface ModelDetails {
  parent_model: string
  format: string
  family: string
  families: string[]
  parameter_size: string
  quantization_level: string
}

interface ModelResponse {
  name: string
  modified_at: Date
  model: string
  size: number
  digest: string
  details: ModelDetails
  expires_at: Date
  size_vram: number
  context_length: number
}

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

      return listRes.models.map((m) => {
        const loadedInstance = psRes.models.find((p) => p.name === m.name) as
          | ModelResponse
          | undefined

        const meta: Record<string, string | number> = {}
        if (m.details.family) meta.family = m.details.family
        if (m.details.parameter_size) meta.params_string = m.details.parameter_size
        if (m.details.quantization_level) meta.quantization = m.details.quantization_level
        if (m.details.format) meta.format = m.details.format

        const parts = m.name.split('/')
        let displayName = m.name
        if (parts.length === 3) {
          const publisher = parts[1]
          meta.publisher = publisher
          displayName = parts[2].split(':')[0]
        }

        return {
          id: m.name,
          name: displayName,
          providerId: instanceId,
          sizeBytes: m.size,
          type: m.name.includes('embed') ? 'embedding' : 'llm',
          loadedInstances: loadedInstance
            ? [
                {
                  id: loadedInstance.name,
                  config: { context_length: loadedInstance.context_length }
                }
              ]
            : [],
          meta
        }
      })
    },

    async chat(modelId: string, request: ChatRequest): Promise<ChatResponse> {
      const messages: { role: string; content: string }[] = []

      if (request.system_prompt) {
        messages.push({ role: 'system', content: request.system_prompt })
      }

      if (typeof request.input === 'string') {
        messages.push({ role: 'user', content: request.input })
      } else {
        const text = request.input
          .filter((item) => item.type === 'message')
          .map((item) => (item as { type: 'message'; content: string }).content)
          .join('\n')
        messages.push({ role: 'user', content: text })
      }

      const ollamaBody = {
        model: modelId,
        messages,
        options: {
          temperature: request.temperature,
          top_p: request.top_p,
          top_k: request.top_k,
          repeat_penalty: request.repeat_penalty,
          num_predict: request.max_output_tokens
        }
      }
      console.log('[ollama] chat body:', JSON.stringify(ollamaBody, null, 2))
      const response = await client.chat(ollamaBody)

      return {
        model_instance_id: modelId,
        output: [{ type: 'message', content: response.message.content }],
        stats: {
          input_tokens: response.prompt_eval_count,
          total_output_tokens: response.eval_count,
          reasoning_output_tokens: 0,
          tokens_per_second: response.eval_count / (response.eval_duration / 1e9),
          time_to_first_token_seconds: response.prompt_eval_duration / 1e9
        }
      }
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
            const existing = downloadJobs.get(jobId)!
            downloadJobs.set(jobId, {
              ...existing,
              status: 'downloading',
              downloaded_bytes: chunk.completed,
              total_size_bytes: chunk.total
            })
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
