import { ModelModality } from '@shared/provider/external-model'
import type { ExternalModelPricing } from '@shared/provider/external-model'

export interface OpenAIModelMetadata {
  description?: string
  contextLength: number
  maxOutputTokens?: number
  inputModalities?: string[]
  outputModalities?: string[]
  pricing?: ExternalModelPricing
  knowledgeCutoff?: string
}

const TEXT_IN = [ModelModality.Text, ModelModality.Image, ModelModality.File]
const TEXT_OUT = [ModelModality.Text]
const AUDIO_IN = [ModelModality.Text, ModelModality.Audio]
const AUDIO_OUT = [ModelModality.Text, ModelModality.Audio]

export const OPENAI_MODELS: Record<string, OpenAIModelMetadata> = {
  'gpt-6-astra': {
    description:
      "OpenAI's most capable model, with frontier reasoning and long-context performance.",
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 10, outputPerMTokens: 50, cacheReadPerMTokens: 1 },
    knowledgeCutoff: '2026-04-30'
  },
  'gpt-5.6-sol': {
    description:
      'Highest-capability tier of the GPT-5.6 family, tuned for complex reasoning and agentic work.',
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 20, cacheReadPerMTokens: 0.4 },
    knowledgeCutoff: '2026-02-16'
  },
  'gpt-5.6-terra': {
    description: 'Balanced GPT-5.6 tier trading some capability for lower cost.',
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2, outputPerMTokens: 12, cacheReadPerMTokens: 0.2 },
    knowledgeCutoff: '2026-02-16'
  },
  'gpt-5.6-luna': {
    description: 'Fastest and cheapest GPT-5.6 tier for high-volume tasks.',
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.2, outputPerMTokens: 1.2, cacheReadPerMTokens: 0.02 },
    knowledgeCutoff: '2026-02-16'
  },
  'gpt-5.5': {
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 5, outputPerMTokens: 30, cacheReadPerMTokens: 0.5 },
    knowledgeCutoff: '2025-12-01'
  },
  'gpt-5.5-pro': {
    description: 'Extended-reasoning variant of GPT-5.5 for the hardest problems.',
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 30, outputPerMTokens: 180 },
    knowledgeCutoff: '2025-12-01'
  },
  'gpt-5.4': {
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2.5, outputPerMTokens: 15, cacheReadPerMTokens: 0.25 }
  },
  'gpt-5.4-pro': {
    contextLength: 1050000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 30, outputPerMTokens: 180 }
  },
  'gpt-5.4-mini': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.75, outputPerMTokens: 4.5, cacheReadPerMTokens: 0.075 },
    knowledgeCutoff: '2025-08-31'
  },
  'gpt-5.4-nano': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.2, outputPerMTokens: 1.25, cacheReadPerMTokens: 0.02 },
    knowledgeCutoff: '2025-08-31'
  },
  'gpt-5.3-codex': {
    description: 'Coding-specialized model for software engineering and agentic development tasks.',
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.75, outputPerMTokens: 14, cacheReadPerMTokens: 0.175 }
  },
  'gpt-5.2': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.75, outputPerMTokens: 14, cacheReadPerMTokens: 0.175 }
  },
  'gpt-5.2-pro': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 21, outputPerMTokens: 168 }
  },
  'gpt-5.1': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.25, outputPerMTokens: 10, cacheReadPerMTokens: 0.125 }
  },
  'gpt-5': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.25, outputPerMTokens: 10, cacheReadPerMTokens: 0.125 },
    knowledgeCutoff: '2024-09-30'
  },
  'gpt-5-mini': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.25, outputPerMTokens: 2, cacheReadPerMTokens: 0.025 },
    knowledgeCutoff: '2024-05-31'
  },
  'gpt-5-nano': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.05, outputPerMTokens: 0.4, cacheReadPerMTokens: 0.005 },
    knowledgeCutoff: '2024-05-31'
  },
  'gpt-5-pro': {
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 15, outputPerMTokens: 120 },
    knowledgeCutoff: '2024-09-30'
  },
  'gpt-5-search-api': {
    description: 'GPT-5 variant with built-in web search for grounded answers.',
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.25, outputPerMTokens: 10, cacheReadPerMTokens: 0.125 },
    knowledgeCutoff: '2024-09-30'
  },
  'chat-latest': {
    description: 'Tracks the model currently powering ChatGPT; behavior changes without notice.',
    contextLength: 400000,
    maxOutputTokens: 128000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 5, outputPerMTokens: 30, cacheReadPerMTokens: 0.5 }
  },
  'gpt-4.1': {
    contextLength: 1047576,
    maxOutputTokens: 32768,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2, outputPerMTokens: 8, cacheReadPerMTokens: 0.5 },
    knowledgeCutoff: '2024-06-30'
  },
  'gpt-4.1-mini': {
    contextLength: 1047576,
    maxOutputTokens: 32768,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.4, outputPerMTokens: 1.6, cacheReadPerMTokens: 0.1 },
    knowledgeCutoff: '2024-06-30'
  },
  'gpt-4.1-nano': {
    contextLength: 1047576,
    maxOutputTokens: 32768,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.1, outputPerMTokens: 0.4, cacheReadPerMTokens: 0.025 },
    knowledgeCutoff: '2024-06-30'
  },
  'gpt-4o': {
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2.5, outputPerMTokens: 10, cacheReadPerMTokens: 1.25 },
    knowledgeCutoff: '2023-10-31'
  },
  'gpt-4o-mini': {
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.15, outputPerMTokens: 0.6, cacheReadPerMTokens: 0.075 },
    knowledgeCutoff: '2023-10-31'
  },
  'gpt-4o-search-preview': {
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2.5, outputPerMTokens: 10 },
    knowledgeCutoff: '2023-10-31'
  },
  'gpt-4o-mini-search-preview': {
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.15, outputPerMTokens: 0.6 },
    knowledgeCutoff: '2023-10-31'
  },
  o3: {
    description: 'Reasoning model for math, science and multi-step technical problems.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 2, outputPerMTokens: 8, cacheReadPerMTokens: 0.5 },
    knowledgeCutoff: '2024-06-30'
  },
  'o4-mini': {
    description: 'Smaller, faster reasoning model.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    inputModalities: TEXT_IN,
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.1, outputPerMTokens: 4.4, cacheReadPerMTokens: 0.275 },
    knowledgeCutoff: '2024-06-30'
  },
  'gpt-audio': {
    description: 'Speech-in, speech-out model for audio conversations. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 2.5, outputPerMTokens: 10 }
  },
  'gpt-audio-mini': {
    description: 'Smaller speech-in, speech-out model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 0.6, outputPerMTokens: 2.4 }
  },
  'gpt-audio-1.5': {
    description: 'Speech-in, speech-out model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 2.5, outputPerMTokens: 10 }
  },
  'gpt-realtime-2.1': {
    description: 'Low-latency realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 24, cacheReadPerMTokens: 0.4 }
  },
  'gpt-realtime-2.1-mini': {
    description: 'Smaller realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 0.6, outputPerMTokens: 2.4, cacheReadPerMTokens: 0.06 }
  },
  'gpt-realtime-2': {
    description: 'Realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 24, cacheReadPerMTokens: 0.4 }
  },
  'gpt-realtime': {
    description: 'Realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 16, cacheReadPerMTokens: 0.4 }
  },
  'gpt-realtime-mini': {
    description: 'Smaller realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 0.6, outputPerMTokens: 2.4, cacheReadPerMTokens: 0.06 }
  },
  'gpt-live-1': {
    description: 'Realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 24, cacheReadPerMTokens: 0.4 }
  },
  'gpt-realtime-1.5': {
    description: 'Realtime speech model. Priced here at text rates.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    inputModalities: AUDIO_IN,
    outputModalities: AUDIO_OUT,
    pricing: { inputPerMTokens: 4, outputPerMTokens: 16, cacheReadPerMTokens: 0.4 }
  },
  'gpt-image-2.5-sunburst': {
    description: 'Image generation model. Priced here at image input/output rates.',
    contextLength: 0,
    inputModalities: [ModelModality.Text, ModelModality.Image],
    outputModalities: [ModelModality.Image],
    pricing: { inputPerMTokens: 8, outputPerMTokens: 30, cacheReadPerMTokens: 2 }
  },
  'gpt-image-2.5-flare': {
    description: 'Image generation model. Priced here at image input/output rates.',
    contextLength: 0,
    inputModalities: [ModelModality.Text, ModelModality.Image],
    outputModalities: [ModelModality.Image],
    pricing: { inputPerMTokens: 8, outputPerMTokens: 30, cacheReadPerMTokens: 2 }
  },
  'gpt-image-2': {
    description: 'Image generation model. Priced here at image input/output rates.',
    contextLength: 0,
    inputModalities: [ModelModality.Text, ModelModality.Image],
    outputModalities: [ModelModality.Image],
    pricing: { inputPerMTokens: 8, outputPerMTokens: 30, cacheReadPerMTokens: 2 }
  },
  'gpt-transcribe': {
    description: 'Speech-to-text model billed per minute of audio, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Audio],
    outputModalities: [ModelModality.Transcription]
  },
  'gpt-live-transcribe': {
    description: 'Streaming speech-to-text model billed per minute of audio, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Audio],
    outputModalities: [ModelModality.Transcription]
  },
  'gpt-realtime-whisper': {
    description: 'Realtime transcription model billed per minute of audio, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Audio],
    outputModalities: [ModelModality.Transcription]
  },
  'gpt-realtime-translate': {
    description: 'Realtime speech translation model billed per minute of audio, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Audio],
    outputModalities: [ModelModality.Transcription]
  },
  'gpt-4o-mini-transcribe': {
    contextLength: 16000,
    inputModalities: [ModelModality.Audio],
    outputModalities: [ModelModality.Transcription],
    pricing: { inputPerMTokens: 1.25, outputPerMTokens: 5 }
  },
  'gpt-4o-mini-tts': {
    description: 'Text-to-speech model.',
    contextLength: 0,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Speech]
  },
  'tts-1': {
    description: 'Text-to-speech model billed per 1M characters, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Speech]
  },
  'tts-1-hd': {
    description: 'Higher-quality text-to-speech model billed per 1M characters, not per token.',
    contextLength: 0,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Speech]
  },
  'text-embedding-3-small': {
    contextLength: 8191,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Embeddings],
    pricing: { inputPerMTokens: 0.02, outputPerMTokens: 0 }
  },
  'text-embedding-3-large': {
    contextLength: 8191,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Embeddings],
    pricing: { inputPerMTokens: 0.13, outputPerMTokens: 0 }
  },
  'text-embedding-ada-002': {
    contextLength: 8191,
    inputModalities: [ModelModality.Text],
    outputModalities: [ModelModality.Embeddings],
    pricing: { inputPerMTokens: 0.1, outputPerMTokens: 0 }
  },
  'omni-moderation': {
    description: 'Free content moderation model.',
    contextLength: 32768,
    inputModalities: [ModelModality.Text, ModelModality.Image],
    outputModalities: [ModelModality.Text],
    pricing: { inputPerMTokens: 0, outputPerMTokens: 0 }
  },
  'gpt-3.5-turbo': {
    contextLength: 16385,
    maxOutputTokens: 4096,
    inputModalities: [ModelModality.Text],
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.5, outputPerMTokens: 1.5 },
    knowledgeCutoff: '2021-09-30'
  },
  'gpt-3.5-turbo-16k': {
    contextLength: 16385,
    maxOutputTokens: 4096,
    inputModalities: [ModelModality.Text],
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 0.5, outputPerMTokens: 1.5 },
    knowledgeCutoff: '2021-09-30'
  },
  'gpt-3.5-turbo-instruct': {
    contextLength: 4096,
    maxOutputTokens: 4096,
    inputModalities: [ModelModality.Text],
    outputModalities: TEXT_OUT,
    pricing: { inputPerMTokens: 1.5, outputPerMTokens: 2 },
    knowledgeCutoff: '2021-09-30'
  }
}

const SNAPSHOT_SUFFIX = /-(\d{4}-\d{2}-\d{2}|\d{4}|latest)$/

export function findOpenAIModelMetadata(modelId: string): OpenAIModelMetadata | undefined {
  const direct = OPENAI_MODELS[modelId]
  if (direct) return direct

  const base = modelId.replace(SNAPSHOT_SUFFIX, '')
  if (base !== modelId) return OPENAI_MODELS[base]

  return undefined
}
