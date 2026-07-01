import type { ChatRequest, ChatResponse } from '@shared/provider/chat'
import type { LLMProvider } from '../../../core/providers/base'

export class ChatTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatTimeoutError'
  }
}

export async function runChat(
  provider: LLMProvider,
  request: ChatRequest,
  runSignal: AbortSignal,
  timeoutMs: number
): Promise<ChatResponse> {
  if (!provider.chat) throw new Error(`${provider.id}: chat not supported`)
  if (runSignal.aborted) throw new DOMException('Aborted', 'AbortError')

  const controller = new AbortController()
  const onRunAbort = (): void => controller.abort()
  runSignal.addEventListener('abort', onRunAbort)

  let timedOut = false
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeoutMs)
      : undefined

  const abortPromise = new Promise<never>((_, reject) => {
    controller.signal.addEventListener('abort', () => {
      if (timedOut) {
        reject(new ChatTimeoutError(`Timed out after ${timeoutMs}ms`))
      } else {
        reject(new DOMException('Aborted', 'AbortError'))
      }
    })
  })

  const chatPromise = provider.chat(request, { abortSignal: controller.signal })
  chatPromise.catch(() => {})

  try {
    return await Promise.race([chatPromise, abortPromise])
  } finally {
    if (timer) clearTimeout(timer)
    runSignal.removeEventListener('abort', onRunAbort)
  }
}
