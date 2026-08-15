const REPO = 'https://github.com/BekirUzun/cannonade'

export const site = {
  name: 'Cannonade',
  tagline: 'Test suites for local and cloud models',
  description:
    'Cannonade is a desktop app for building LLM test suites and running them across several models at once, then comparing the results. Suites, prompts, and runs are stored as files on your own machine.',
  repo: REPO,
  issues: `${REPO}/issues`,
  releases: `${REPO}/releases`,
  latest: `${REPO}/releases/latest`,
  docs: '/docs/guides/quick-start/'
}

export interface DownloadTarget {
  os: string
  format: string
  note: string
}

export const downloadTargets: DownloadTarget[] = [
  { os: 'Windows', format: '.exe installer', note: 'Windows 10 and later, x64' },
  { os: 'macOS', format: '.dmg', note: 'Apple silicon and Intel' },
  { os: 'Linux', format: '.AppImage', note: 'x64, no install required' }
]
