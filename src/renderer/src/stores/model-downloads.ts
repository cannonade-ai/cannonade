import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useModelsStore } from './models'
import { useToastStore } from './toast'
import { createLogger } from '../utils/logger'

const log = createLogger('model-downloads-store')

const POLL_INTERVAL_MS = 1000
const COMPLETED_LINGER_MS = 5000

export type ModelDownloadStatus = 'downloading' | 'paused' | 'completed' | 'failed'

export interface ModelDownload {
  jobId: string
  instanceId: string
  label: string
  quantization?: string
  status: ModelDownloadStatus
  downloadedBytes: number
  totalBytes: number
  bytesPerSecond?: number
  error?: string
}

export interface StartDownloadParams {
  instanceId: string
  downloadTarget: string
  label: string
  quantization?: string
}

export const useModelDownloadsStore = defineStore('model-downloads', () => {
  const modelsStore = useModelsStore()
  const toast = useToastStore()

  const downloads = ref<ModelDownload[]>([])
  const timers = new Map<string, ReturnType<typeof setInterval>>()

  function find(jobId: string): ModelDownload | undefined {
    return downloads.value.find((d) => d.jobId === jobId)
  }

  function stopPolling(jobId: string): void {
    const timer = timers.get(jobId)
    if (timer) clearInterval(timer)
    timers.delete(jobId)
  }

  function dismiss(jobId: string): void {
    stopPolling(jobId)
    downloads.value = downloads.value.filter((d) => d.jobId !== jobId)
  }

  async function finish(download: ModelDownload): Promise<void> {
    download.status = 'completed'
    stopPolling(download.jobId)
    log.info(`Download ${download.jobId} completed for ${download.label}`)
    toast.success(`${download.label} downloaded`)
    await modelsStore.loadLocalModels()
    setTimeout(() => dismiss(download.jobId), COMPLETED_LINGER_MS)
  }

  function fail(download: ModelDownload, message: string): void {
    download.status = 'failed'
    download.error = message
    stopPolling(download.jobId)
    toast.error(`Download failed: ${download.label}`, { title: message })
  }

  function poll(jobId: string): void {
    const timer = setInterval(async () => {
      const download = find(jobId)
      if (!download) {
        stopPolling(jobId)
        return
      }
      try {
        const status = await api.downloadModelStatus(download.instanceId, jobId)
        download.downloadedBytes = status.downloaded_bytes ?? download.downloadedBytes
        download.totalBytes = status.total_size_bytes ?? download.totalBytes
        download.bytesPerSecond = status.bytes_per_second
        if (status.status === 'completed' || status.status === 'already_downloaded') {
          await finish(download)
        } else if (status.status === 'failed') {
          fail(download, 'The provider reported a failed download.')
        } else {
          download.status = status.status
        }
      } catch (e) {
        log.error(`Failed to poll download status for ${jobId}:`, e)
        fail(download, e instanceof Error ? e.message : 'Failed to read download status')
      }
    }, POLL_INTERVAL_MS)
    timers.set(jobId, timer)
  }

  async function start(params: StartDownloadParams): Promise<void> {
    const { instanceId, downloadTarget, label, quantization } = params
    const response = await api.downloadModel(instanceId, downloadTarget, quantization)

    if (response.status === 'already_downloaded') {
      log.info(`${label} is already downloaded`)
      toast.info(`${label} is already downloaded`)
      await modelsStore.loadLocalModels()
      return
    }
    if (response.status === 'failed') {
      const message = `${label} could not be queued for download.`
      log.error(message)
      throw new Error(message)
    }

    const jobId = response.job_id
    downloads.value.push({
      jobId,
      instanceId,
      label,
      quantization,
      status: response.status,
      downloadedBytes: 0,
      totalBytes: response.total_size_bytes ?? 0
    })
    log.info(`Started download ${jobId} for ${label}`)
    poll(jobId)
  }

  return { downloads, start, dismiss }
})
