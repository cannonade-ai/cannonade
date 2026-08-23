import type { HuggingFaceModelDetails, ModelQuantOption } from '@shared/provider/huggingface-model'
import type { HuggingFaceModelResponse, HuggingFaceSibling } from './types'

const SHARD_SUFFIX = /-\d{5}-of-\d{5}$/i
const QUANT_TOKEN =
  /(?:^|[-_./])((?:IQ|Q)\d+[A-Za-z0-9_]*|BF16|FP16|F16|F32|MXFP4(?:_MOE)?)(?=[-_./]|$)/gi

function toQuantLabel(fileName: string): string | null {
  const withoutExtension = fileName.replace(/\.gguf$/i, '').replace(SHARD_SUFFIX, '')
  const matches = [...withoutExtension.matchAll(QUANT_TOKEN)]
  const last = matches[matches.length - 1]
  return last ? last[1].toUpperCase() : null
}

function siblingSize(sibling: HuggingFaceSibling): number {
  return sibling.lfs?.size ?? sibling.size ?? 0
}

export function toQuantOptions(siblings: HuggingFaceSibling[]): ModelQuantOption[] {
  const byLabel = new Map<string, ModelQuantOption>()

  for (const sibling of siblings) {
    if (!/\.gguf$/i.test(sibling.rfilename)) continue
    const label = toQuantLabel(sibling.rfilename)
    if (!label) continue
    const existing = byLabel.get(label)
    if (existing) {
      existing.fileNames.push(sibling.rfilename)
      existing.sizeBytes += siblingSize(sibling)
    } else {
      byLabel.set(label, {
        label,
        fileNames: [sibling.rfilename],
        sizeBytes: siblingSize(sibling)
      })
    }
  }

  return [...byLabel.values()].sort((a, b) => a.sizeBytes - b.sizeBytes)
}

export function toModelDetails(response: HuggingFaceModelResponse): HuggingFaceModelDetails {
  const modelId = response.id
  return {
    modelId,
    author: response.author ?? modelId.split('/')[0],
    task: response.pipeline_tag,
    tags: response.tags ?? [],
    downloadCount: response.downloads ?? 0,
    likeCount: response.likes ?? 0,
    updatedAt: response.lastModified,
    isGated: response.gated !== undefined && response.gated !== false,
    architecture: response.gguf?.architecture,
    contextLength: response.gguf?.context_length,
    quantOptions: toQuantOptions(response.siblings ?? [])
  }
}
