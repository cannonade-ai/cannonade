import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import { useProvidersStore } from './providers'
import { usePromptsStore } from './prompts'
import { getPromptVersion } from '@shared/app/prompt'
import type { PromptVersionRef } from '@shared/app/prompt'
import type {
  ChatMessage,
  ChatRequest,
  ChatStats,
  MessageOutput,
  ReasoningOutput
} from '@shared/provider/chat'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'
import { supportsTextOutput } from '@shared/provider/external-model'
import { createLogger } from '../utils/logger'

const log = createLogger('playground-store')

export interface PlaygroundMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  stats?: ChatStats
  error?: string
}

export interface PlaygroundParams {
  temperature?: number
  top_p?: number
  top_k?: number
  min_p?: number
  repeat_penalty?: number
  frequency_penalty?: number
  presence_penalty?: number
  seed?: number
  max_output_tokens?: number
  reasoning?: 'off' | 'low' | 'medium' | 'high' | 'on'
}

export interface PlaygroundModelOption {
  id: string
  name: string
  loaded: boolean
}

export interface LinkedPrompt {
  promptId: string
  version: PromptVersionRef
  modified: boolean
}

export const usePlaygroundStore = defineStore('playground', () => {
  const providersStore = useProvidersStore()
  const promptsStore = usePromptsStore()

  const providerId = ref('')
  const modelId = ref('')
  const models = ref<PlaygroundModelOption[]>([])
  const modelsLoading = ref(false)
  const modelsError = ref<string | null>(null)
  const systemPrompt = ref('')
  const messages = ref<PlaygroundMessage[]>([])
  const params = ref<PlaygroundParams>({})
  const sending = ref(false)
  const currentRequestId = ref<string | null>(null)
  const linkedPrompt = ref<LinkedPrompt | null>(null)
  const chatCapable = ref<Record<string, boolean>>({})
  const initialized = ref(false)

  const chatProviders = computed<ConfiguredProvider[]>(() =>
    providersStore.configuredProviders.filter((p) => chatCapable.value[p.instanceId])
  )

  const lastStats = computed<ChatStats | null>(() => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const stats = messages.value[i].stats
      if (stats) return stats
    }
    return null
  })

  const canSend = computed<boolean>(() => !sending.value && !!providerId.value && !!modelId.value)

  async function init(): Promise<void> {
    if (initialized.value) return
    initialized.value = true
    for (const provider of providersStore.configuredProviders) {
      try {
        const caps = await providersStore.getCapabilities(provider.instanceId)
        chatCapable.value[provider.instanceId] = caps.chat
      } catch (e) {
        log.error(`Failed to get capabilities for ${provider.instanceId}:`, e)
        chatCapable.value[provider.instanceId] = false
      }
    }
    if (!providerId.value) {
      const candidates = chatProviders.value
      const initial = candidates.find((p) => p.isDefault) ?? candidates[0]
      if (initial) await selectProvider(initial.instanceId)
    }
  }

  async function selectProvider(instanceId: string): Promise<void> {
    providerId.value = instanceId
    modelId.value = ''
    await loadModels()
  }

  async function loadModels(): Promise<void> {
    if (!providerId.value) return
    modelsLoading.value = true
    modelsError.value = null
    models.value = []
    try {
      const capabilities = await providersStore.getCapabilities(providerId.value)
      if (capabilities.externalModels) {
        const external = await api.fetchExternalModels(providerId.value)
        models.value = external
          .filter(supportsTextOutput)
          .map((m) => ({ id: m.id, name: m.name, loaded: false }))
      } else {
        const local = await api.fetchLocalModels(providerId.value)
        models.value = local
          .filter((m) => m.type === 'llm')
          .map((m) => ({ id: m.id, name: m.name, loaded: m.loadedInstances.length > 0 }))
      }
      if (!models.value.some((m) => m.id === modelId.value)) {
        const loaded = models.value.find((m) => m.loaded)
        modelId.value = loaded?.id ?? models.value[0]?.id ?? ''
      }
    } catch (e) {
      const providerName =
        providersStore.getProvider(providerId.value)?.displayName ?? providerId.value
      if (e instanceof Error && e.message.includes('fetch failed')) {
        modelsError.value = `Cannot connect to "${providerName}". Make sure the service is running and the server URL is correct.`
      } else if (e instanceof Error) {
        modelsError.value = e.message
      } else {
        modelsError.value = 'Failed to load models'
      }
      log.error('Failed to load models:', modelsError.value)
    } finally {
      modelsLoading.value = false
    }
  }

  function buildRequest(): ChatRequest {
    const history: ChatMessage[] = messages.value
      .filter((m) => !m.error && m.content)
      .map((m) => ({ role: m.role, content: m.content }))
    const request: ChatRequest = {
      model: modelId.value,
      messages: history,
      ...params.value
    }
    if (systemPrompt.value.trim()) {
      request.system_prompt = systemPrompt.value
    }
    return request
  }

  async function dispatch(): Promise<void> {
    sending.value = true
    const requestId = crypto.randomUUID()
    currentRequestId.value = requestId
    try {
      const response = await api.chat(providerId.value, requestId, buildRequest())
      const content = response.output
        .filter((o): o is MessageOutput => o.type === 'message')
        .map((o) => o.content)
        .join('\n')
      const reasoning = response.output
        .filter((o): o is ReasoningOutput => o.type === 'reasoning')
        .map((o) => o.content)
        .join('\n')
        .trim()
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        reasoning: reasoning || undefined,
        stats: response.stats
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Chat request failed'
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        error: message
      })
      log.error('Chat request failed:', message)
    } finally {
      sending.value = false
      currentRequestId.value = null
    }
  }

  async function send(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || !canSend.value) return
    messages.value.push({ id: crypto.randomUUID(), role: 'user', content: trimmed })
    await dispatch()
  }

  async function abort(): Promise<void> {
    if (currentRequestId.value) {
      await api.abortChat(currentRequestId.value)
    }
  }

  async function retryLast(): Promise<void> {
    if (sending.value) return
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'assistant' && last.error) {
      messages.value.pop()
    }
    if (messages.value[messages.value.length - 1]?.role !== 'user') return
    await dispatch()
  }

  function clear(): void {
    messages.value = []
  }

  function loadPrompt(promptId: string, version: PromptVersionRef): void {
    const prompt = promptsStore.getById(promptId)
    if (!prompt) return
    const content = getPromptVersion(prompt, version)?.content
    if (content === undefined) return
    systemPrompt.value = content
    linkedPrompt.value = { promptId, version, modified: false }
  }

  function updateSystemPrompt(text: string): void {
    systemPrompt.value = text
    if (linkedPrompt.value && !linkedPrompt.value.modified) {
      const prompt = promptsStore.getById(linkedPrompt.value.promptId)
      const original = prompt
        ? getPromptVersion(prompt, linkedPrompt.value.version)?.content
        : undefined
      if (text !== original) {
        linkedPrompt.value = { ...linkedPrompt.value, modified: true }
      }
    }
  }

  function unlinkPrompt(): void {
    linkedPrompt.value = null
  }

  return {
    providerId,
    modelId,
    models,
    modelsLoading,
    modelsError,
    systemPrompt,
    messages,
    params,
    sending,
    currentRequestId,
    linkedPrompt,
    chatProviders,
    lastStats,
    canSend,
    init,
    selectProvider,
    loadModels,
    send,
    abort,
    retryLast,
    clear,
    loadPrompt,
    updateSystemPrompt,
    unlinkPrompt
  }
})
