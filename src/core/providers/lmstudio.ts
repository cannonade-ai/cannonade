import { readFile, rm } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { loadAppSettings } from '../../main/ipc/settings-handlers'
import type { LLMProvider } from './base'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import type { ChatRequest, ChatResponse } from '@shared/lm-studio/chat'

async function apiBase(): Promise<string> {
  const settings = await loadAppSettings()
  return `http://localhost:${settings.lmStudioPort}`
}

export async function loadModel(modelKey: string): Promise<void> {
  const base = await apiBase()
  const res = await fetch(`${base}/api/v1/models/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelKey })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
}

export async function unloadModel(instanceId: string): Promise<void> {
  const base = await apiBase()
  const res = await fetch(`${base}/api/v1/models/unload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instance_id: instanceId })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
}

export async function deleteModel(model: Model): Promise<void> {
  const settingsPath = join(homedir(), '.lmstudio', 'settings.json')
  const raw = await readFile(settingsPath, 'utf-8')
  const settings = JSON.parse(raw) as { downloadsFolder: string }
  const folderName = `${model.key}-${(model.format ?? '').toUpperCase()}`
  const modelPath = join(settings.downloadsFolder, model.publisher, folderName)
  await rm(modelPath, { recursive: true, force: true })
}

export const lmStudioProvider: LLMProvider = {
  async fetchModels(): Promise<Model[]> {
    const base = await apiBase()
    const res = await fetch(`${base}/api/v1/models`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const data = (await res.json()) as { models: Model[] }
    return data.models
  },

  async chat(request: ChatRequest, apiToken?: string): Promise<ChatResponse> {
    const base = await apiBase()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`

    const res = await fetch(`${base}/api/v1/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    return res.json() as Promise<ChatResponse>
  }
}
