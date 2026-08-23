export interface ModelQuantOption {
  label: string
  fileNames: string[]
  sizeBytes: number
}

export interface HuggingFaceModelDetails {
  modelId: string
  author: string
  task?: string
  tags: string[]
  downloadCount: number
  likeCount: number
  updatedAt?: string
  isGated: boolean
  architecture?: string
  contextLength?: number
  quantOptions: ModelQuantOption[]
}

const HF_HOSTS = ['huggingface.co', 'www.huggingface.co', 'hf.co']
const HF_PATH_PREFIXES = ['models']

export function isHuggingFaceUrl(input: string): boolean {
  if (!input) return false
  const host = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
  return HF_HOSTS.includes(host.toLowerCase())
}

export function toHuggingFaceModelId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const withoutScheme = trimmed.replace(/^https?:\/\//i, '')
  const [maybeHost, ...hostPath] = withoutScheme.split('/')
  const path = HF_HOSTS.includes(maybeHost.toLowerCase()) ? hostPath.join('/') : withoutScheme

  const segments = path.split('?')[0].split('#')[0].split('/').filter(Boolean)
  const withoutPrefix = HF_PATH_PREFIXES.includes(segments[0]?.toLowerCase())
    ? segments.slice(1)
    : segments
  if (withoutPrefix.length < 2) return null
  return withoutPrefix.slice(0, 2).join('/')
}

export function toHuggingFaceModelUrl(modelId: string): string {
  return `https://huggingface.co/${modelId}`
}
