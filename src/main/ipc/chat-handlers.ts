import { ipcMain } from 'electron'
import { getProvider } from '../../core/providers/registry'
import { PROVIDER } from '@shared/provider/ipc-channels'
import type { ChatRequest, ChatResponse } from '@shared/provider/chat'
import { createLogger } from '../logger'

const log = createLogger('chat-handler')

const chatAborts = new Map<string, AbortController>()

export function registerChatHandlers(): void {
  ipcMain.handle(
    PROVIDER.CHAT,
    async (
      _event,
      providerId: string,
      requestId: string,
      request: ChatRequest
    ): Promise<ChatResponse> => {
      const provider = getProvider(providerId)
      if (!provider.chat || !provider.capabilities.chat) {
        throw new Error(`${providerId}: chat not supported`)
      }
      const controller = new AbortController()
      chatAborts.set(requestId, controller)
      log.debug(`Chat request ${requestId} for provider ${providerId}, model ${request.model}`)
      try {
        return await provider.chat(request, { abortSignal: controller.signal })
      } finally {
        chatAborts.delete(requestId)
      }
    }
  )

  ipcMain.handle(PROVIDER.CHAT_ABORT, (_event, requestId: string): void => {
    log.debug(`Aborting chat request ${requestId}`)
    chatAborts.get(requestId)?.abort()
  })
}
