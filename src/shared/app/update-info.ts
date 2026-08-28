export const UpdateStatus = {
  Idle: 'idle',
  Available: 'available',
  Downloading: 'downloading',
  Ready: 'ready',
  Error: 'error'
} as const

export interface UpdateState {
  status: string
  currentVersion: string
  latestVersion: string
  percent: number
  error: string
}

export const CHANGELOG_URL = 'https://github.com/cannonade-ai/cannonade/blob/main/CHANGELOG.md'
export const RELEASES_URL = 'https://github.com/cannonade-ai/cannonade/releases'
