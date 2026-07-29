import type { ChatMessage, ChatRequest, ChatResponse, ChatStats } from '@shared/provider/chat'
import type { JudgeSettings, JudgeUsage } from '@shared/app/judge'
import type { LLMProvider } from '../../../core/providers/base'
import { getProvider } from '../../../core/providers/registry'
import { runChat } from '../../services/test-runner/chat-handler'
import { extractTextOutput } from '../../services/test-runner/mappers'
import { getAppSettings } from '../../ipc/settings-handlers'
import { createLogger } from '../../logger'

const log = createLogger('judge-client')

export class JudgeError extends Error {
  readonly fatal: boolean

  constructor(message: string, fatal = false) {
    super(message)
    this.name = 'JudgeError'
    this.fatal = fatal
  }
}

export interface JudgeResponse {
  content: string
  usage: JudgeUsage
}

export function resolveJudgeSettings(): JudgeSettings {
  const { judge } = getAppSettings()
  if (!judge?.providerInstanceId || !judge?.modelId) {
    throw new JudgeError(
      'No judge model configured. Pick one in Settings > Test Runs > LLM judge.',
      true
    )
  }
  return judge
}

function toJudgeUsage(model: string, stats: ChatStats | undefined): JudgeUsage {
  const usage: JudgeUsage = { model }
  if (!stats) return usage
  if (stats.input_tokens != null) usage.inputTokens = stats.input_tokens
  if (stats.total_output_tokens != null) usage.outputTokens = stats.total_output_tokens
  if (stats.input_tokens != null || stats.total_output_tokens != null) {
    usage.totalTokens = (stats.input_tokens ?? 0) + (stats.total_output_tokens ?? 0)
  }
  if (stats.cost != null) usage.cost = stats.cost
  return usage
}

export async function callJudge(
  messages: ChatMessage[],
  abortSignal?: AbortSignal
): Promise<JudgeResponse> {
  const settings = resolveJudgeSettings()

  let provider: LLMProvider
  try {
    provider = getProvider(settings.providerInstanceId)
  } catch {
    throw new JudgeError(
      `Judge provider "${settings.providerInstanceId}" is not configured anymore.`,
      true
    )
  }
  if (!provider.chat) {
    throw new JudgeError(
      `Judge provider "${settings.providerInstanceId}" does not support chat.`,
      true
    )
  }

  const request: ChatRequest = {
    model: settings.modelId,
    messages,
    temperature: settings.temperature,
    max_output_tokens: settings.maxOutputTokens
  }

  let response: ChatResponse
  try {
    response = await runChat(
      provider,
      request,
      abortSignal ?? new AbortController().signal,
      settings.timeoutMs ?? 0
    )
  } catch (err) {
    if (abortSignal?.aborted) throw err
    const message = err instanceof Error ? err.message : String(err)
    log.error('Judge request failed:', message)
    throw new JudgeError(`Judge request failed: ${message}`)
  }

  const content = extractTextOutput(response.output)
  const usage = toJudgeUsage(settings.modelId, response.stats)
  if (!content.trim()) {
    throw new JudgeError('Judge returned an empty response.')
  }

  log.debug('Judge response:', content)
  return { content, usage }
}
