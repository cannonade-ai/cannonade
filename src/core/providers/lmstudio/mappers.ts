import type { Model } from './types'
import type { LocalModel } from '@shared/provider/local-model'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'

export function toLocalModel(model: Model, instanceId: string): LocalModel {
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

export function parseStatusOutput(output: string): ServerStatusResponse {
  const portMatch = output.match(/port (\d+)/)
  return {
    running: output.toLowerCase().includes('is running'),
    port: portMatch ? Number(portMatch[1]) : null
  }
}

export function parseStartOutput(output: string): ServerStatusResponse {
  const portMatch = output.match(/port (\d+)/)
  return {
    running: output.toLowerCase().includes('running'),
    port: portMatch ? Number(portMatch[1]) : null
  }
}

export function parseStopOutput(output: string): ServerStatusResponse {
  return {
    running: !output.toLowerCase().includes('stopped'),
    port: null
  }
}
