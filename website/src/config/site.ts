declare const __APP_VERSION__: string;

const REPO = 'https://github.com/BekirUzun/cannonade';

export const site = {
  name: 'Cannonade',
  tagline: 'Fire one test suite at every model you own.',
  description:
    'Cannonade is a local-first desktop app for building LLM test suites, running them against many local and cloud models at once, and comparing the results. No eval harness, no account, no prompts leaving your machine.',
  repo: REPO,
  issues: `${REPO}/issues`,
  releases: `${REPO}/releases`,
  latest: `${REPO}/releases/latest`,
  docs: '/docs/guides/quick-start/',
  version: __APP_VERSION__
};

export interface DownloadTarget {
  os: string;
  format: string;
  note: string;
}

export const downloadTargets: DownloadTarget[] = [
  { os: 'Windows', format: '.exe installer', note: 'Windows 10 and later, x64' },
  { os: 'macOS', format: '.dmg', note: 'Apple silicon and Intel' },
  { os: 'Linux', format: '.AppImage', note: 'x64, no install required' }
];
