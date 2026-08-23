import type { HuggingFaceModelDetails } from '@shared/provider/huggingface-model'
import { toHuggingFaceModelId } from '@shared/provider/huggingface-model'
import { toModelDetails } from './mappers'
import type { HuggingFaceModelResponse } from './types'
import { createLogger } from '../../logger'

const log = createLogger('huggingface')

const HF_API_BASE = 'https://huggingface.co/api/models'

export async function fetchModelDetails(input: string): Promise<HuggingFaceModelDetails> {
  const modelId = toHuggingFaceModelId(input)
  if (!modelId) throw new Error(`Not a HuggingFace model id or URL: "${input}"`)

  const url = `${HF_API_BASE}/${modelId}?blobs=true`
  log.debug(`fetching model details from ${url}`)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    log.error(`GET ${url} failed with status ${res.status}`)
  } else {
    log.debug(`GET ${url} succesfull.`)
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(`"${modelId}" is gated or private on HuggingFace.`)
  }
  if (res.status === 404) throw new Error(`Model "${modelId}" not found on HuggingFace.`)
  if (!res.ok) {
    throw new Error(`HuggingFace request failed with status ${res.status}.`)
  }

  return toModelDetails((await res.json()) as HuggingFaceModelResponse)
}
