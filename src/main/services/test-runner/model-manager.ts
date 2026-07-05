import { getProvider } from '../../../core/providers/registry'
import { RUN } from '@shared/app/ipc-channels'
import type { ModelRef, PerModelRun } from '@shared/app/test-run'
import type { LocalModel } from '@shared/provider/local-model'
import { matchesHfModelId } from '@shared/provider/hf-model-match'
import type { LLMProvider } from '../../../core/providers/base'
import type { SendEvent } from './types'

const HF_BASE_URL = 'https://huggingface.co/'
const POLL_INTERVAL_MS = 1000

export function toHuggingFaceUrl(modelId: string): string {
  return modelId.startsWith('https://') ? modelId : `${HF_BASE_URL}${modelId}`
}

export function extractHfModelId(modelId: string): string {
  return modelId.startsWith(HF_BASE_URL) ? modelId.slice(HF_BASE_URL.length) : modelId
}

export async function resolveModelKey(providerId: string, hfModelId: string): Promise<string> {
  const provider = getProvider(providerId)
  if (!provider.fetchLocalModels) throw new Error(`${providerId}: fetchLocalModels not supported`)

  const findMatch = (models: LocalModel[]): LocalModel | undefined =>
    models.find((m) => matchesHfModelId(m.id, hfModelId))

  let match = findMatch(await provider.fetchLocalModels())
  if (!match) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      match = findMatch(await provider.fetchLocalModels!())
      if (match) break
    }
  }
  if (!match) throw new Error(`Downloaded model not found in provider: ${hfModelId}`)
  return match.id
}

export async function downloadAndPoll(
  providerId: string,
  modelRunId: string,
  downloadTarget: string,
  send: SendEvent,
  signal: AbortSignal
): Promise<boolean> {
  const provider = getProvider(providerId)
  if (!provider.downloadModel) throw new Error(`${providerId}: downloadModel not supported`)
  if (!provider.getDownloadStatus) throw new Error(`${providerId}: getDownloadStatus not supported`)

  const response = await provider.downloadModel(downloadTarget)

  if (response.status === 'already_downloaded') {
    return false
  }

  const jobId = response.job_id
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS / 2))
  while (!signal.aborted) {
    const status = await provider.getDownloadStatus!(jobId)
    if (status.status === 'completed') return true
    if (status.status === 'failed') throw new Error(`Download failed for ${downloadTarget}`)
    send(RUN.MODEL_DOWNLOADING, {
      modelRunId,
      downloadedBytes: status.downloaded_bytes ?? 0,
      totalBytes: status.total_size_bytes ?? response.total_size_bytes ?? 0,
      estimatedCompletion: status.estimated_completion
    })
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('Aborted during download')
}

export async function unloadUnselectedModels(
  provider: LLMProvider,
  modelRuns: PerModelRun[]
): Promise<void> {
  if (!provider.fetchLocalModels || !provider.unloadModel) return

  const selectedModelKeys = new Set(
    modelRuns
      .filter((mr) => mr.modelRef.source === 'installed')
      .map((mr) => (mr.modelRef as { source: 'installed'; modelKey: string }).modelKey)
  )
  try {
    const localModels = await provider.fetchLocalModels()
    for (const m of localModels) {
      if (selectedModelKeys.has(m.id)) continue
      for (const instance of m.loadedInstances) {
        await provider.unloadModel(instance.id)
      }
    }
  } catch (err) {
    console.error('[test-runner] Failed to unload models before run:', err)
  }
}

export async function isModelLoaded(provider: LLMProvider, modelKey: string): Promise<boolean> {
  if (!provider.fetchLocalModels) return false
  try {
    const localModels = await provider.fetchLocalModels()
    return localModels.some((m) => m.id === modelKey && m.loadedInstances.length > 0)
  } catch (err) {
    console.error('[test-runner] Failed to check loaded models:', err)
    return false
  }
}

export async function unloadModelAfterRun(
  provider: LLMProvider,
  providerId: string,
  modelInstanceId: string
): Promise<void> {
  try {
    if (!provider.unloadModel) throw new Error(`${providerId}: unloadModel not supported`)
    await provider.unloadModel(modelInstanceId)
  } catch (err) {
    console.error('[test-runner] Failed to unload model:', err)
  }
}

export async function deleteAutoDownloadedModel(
  provider: LLMProvider,
  providerId: string,
  ref: ModelRef,
  modelKey: string
): Promise<void> {
  try {
    if (ref.source === 'huggingface' || ref.source === 'registry') {
      if (!provider.deleteModel) throw new Error(`${providerId}: deleteModel not supported`)
      await provider.deleteModel(modelKey)
    }
  } catch (err) {
    console.error('[test-runner] Failed to delete auto-downloaded model:', err)
  }
}
