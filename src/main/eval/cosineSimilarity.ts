import { app } from 'electron'
import { join } from 'node:path'
import type { FeatureExtractionPipeline } from '@huggingface/transformers'
import type { EvaluationConfig } from '@shared/app/test-suite'
import type { EvaluationResult } from '@shared/app/test-run'

const PASS_THRESHOLD = 0.8

let extractor: FeatureExtractionPipeline | null = null

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.cacheDir = join(app.getPath('userData'), 'models')
    extractor = (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'q8'
    })) as FeatureExtractionPipeline
  }
  return extractor
}

export async function runCosineSimilarity(
  output: string,
  evaluation: EvaluationConfig
): Promise<EvaluationResult> {
  const expected = typeof evaluation.expected === 'string' ? evaluation.expected : ''
  if (!expected) return { score: 0, passed: false, error: 'No expected value provided' }
  if (!output) return { score: 0, passed: false, error: 'Model output was empty' }

  try {
    const ext = await getExtractor()
    const [embA, embB] = await Promise.all([
      ext(output, { pooling: 'mean', normalize: true }),
      ext(expected, { pooling: 'mean', normalize: true })
    ])
    const a = embA.data as Float32Array
    const b = embB.data as Float32Array
    let dot = 0,
      normA = 0,
      normB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    const score = parseFloat((dot / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4))
    return { score, passed: score >= (evaluation.threshold ?? PASS_THRESHOLD) }
  } catch (err) {
    return { score: 0, passed: false, error: `Cosine similarity error: ${err}` }
  }
}
