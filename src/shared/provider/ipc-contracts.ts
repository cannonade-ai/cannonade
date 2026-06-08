export interface DownloadModelResponse {
  job_id: string
  status: 'downloading' | 'paused' | 'already_downloaded' | 'failed'
  total_size_bytes?: number
  started_at?: string
}

export interface DownloadStatusResponse {
  job_id: string
  status: 'downloading' | 'paused' | 'completed' | 'already_downloaded' | 'failed'
  downloaded_bytes?: number
  total_size_bytes?: number
  started_at?: string
  completed_at?: string
  bytes_per_second?: number
  estimated_completion?: string
}

export interface ServerStatusResponse {
  running: boolean
  port: number | null
}
