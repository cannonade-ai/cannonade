import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import { getLatestVersion, getPromptVersion } from '@shared/app/prompt'
import type { Prompt, PromptVersion } from '@shared/app/prompt'
import type { TestCase, TestCasePromptRef } from '@shared/app/test-suite'
import type { ChatMessage } from '@shared/provider/chat'

export const usePromptsStore = defineStore('prompts', () => {
  const prompts = ref<Prompt[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      prompts.value = await api.listPrompts()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded(): Promise<void> {
    if (!loaded.value) await load()
  }

  function getById(id: string): Prompt | null {
    return prompts.value.find((p) => p.id === id) ?? null
  }

  async function save(prompt: Prompt): Promise<void> {
    prompt.updatedAt = new Date().toISOString()
    await api.savePrompt(JSON.parse(JSON.stringify(toRaw(prompt))))
    const idx = prompts.value.findIndex((p) => p.id === prompt.id)
    if (idx !== -1) {
      prompts.value[idx] = prompt
    } else {
      prompts.value.push(prompt)
    }
  }

  async function remove(id: string): Promise<void> {
    await api.deletePrompt(id)
    prompts.value = prompts.value.filter((p) => p.id !== id)
  }

  async function create(name: string, description: string, content: string): Promise<Prompt> {
    const now = new Date().toISOString()
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      name,
      description: description || undefined,
      createdAt: now,
      updatedAt: now,
      versions: [{ version: 1, content, createdAt: now }]
    }
    await save(prompt)
    return prompt
  }

  async function clone(id: string): Promise<Prompt | null> {
    const original = getById(id)
    if (!original) return null
    const now = new Date().toISOString()
    const copy: Prompt = {
      ...JSON.parse(JSON.stringify(toRaw(original))),
      id: crypto.randomUUID(),
      name: `Copy of ${original.name}`,
      createdAt: now,
      updatedAt: now
    }
    await save(copy)
    return copy
  }

  async function addVersion(prompt: Prompt, content: string): Promise<PromptVersion> {
    const latest = getLatestVersion(prompt)
    if (latest.content === content) return latest
    const next: PromptVersion = {
      version: latest.version + 1,
      content,
      createdAt: new Date().toISOString()
    }
    prompt.versions.push(next)
    await save(prompt)
    return next
  }

  async function setAsLatest(prompt: Prompt, version: number): Promise<PromptVersion> {
    const source = getPromptVersion(prompt, version)
    if (!source) return getLatestVersion(prompt)
    return addVersion(prompt, source.content)
  }

  function resolveContent(promptRef: TestCasePromptRef): string | null {
    const prompt = getById(promptRef.promptId)
    if (!prompt) return null
    return getPromptVersion(prompt, promptRef.version)?.content ?? null
  }

  function resolveTestCases(testCases: TestCase[]): TestCase[] {
    return testCases.map((tc) => {
      if (!tc.promptRef) return tc
      const content = resolveContent(tc.promptRef)
      if (content === null) return tc
      const messages: ChatMessage[] = tc.input.messages ? [...tc.input.messages] : []
      const systemIdx = messages.findIndex((m) => m.role === 'system')
      if (systemIdx !== -1) {
        messages[systemIdx] = { ...messages[systemIdx], content }
      } else {
        messages.unshift({ role: 'system', content })
      }
      return { ...tc, input: { ...tc.input, messages } }
    })
  }

  return {
    prompts,
    loading,
    load,
    ensureLoaded,
    getById,
    save,
    remove,
    create,
    clone,
    addVersion,
    setAsLatest,
    resolveContent,
    resolveTestCases
  }
})
