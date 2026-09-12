const REPO = 'https://github.com/cannonade-ai/cannonade'

// x-release-please-version
export const appVersion = '0.4.8'

const asset = (file: string): string => `${REPO}/releases/download/v${appVersion}/${file}`

export const site = {
  name: 'Cannonade',
  tagline: 'Test suites for local and cloud AI models',
  description:
    'Cannonade is a desktop app for building LLM test suites and running them across several AI models at once. Iterate on your prompts and validate every model output against the checks you define.',
  repo: REPO,
  issues: `${REPO}/issues`,
  releases: `${REPO}/releases`,
  latest: `${REPO}/releases/latest`,
  docs: '/docs',
  ogImage: '/test-run_snippet.png'
}

export interface DownloadTarget {
  os: string
  format: string
  note: string
  url: string
  extraSteps?: boolean
}

export const downloadTargets: DownloadTarget[] = [
  {
    os: 'Windows',
    format: '.exe installer',
    note: 'Windows 10 and later, x64',
    url: asset(`cannonade-${appVersion}-setup.exe`)
  },
  {
    os: 'macOS',
    format: '.dmg',
    note: 'Apple silicon',
    url: asset(`cannonade-${appVersion}.dmg`),
    extraSteps: true
  },
  {
    os: 'Linux',
    format: '.AppImage',
    note: 'x64, no install required',
    url: asset(`cannonade-${appVersion}.AppImage`)
  }
]
