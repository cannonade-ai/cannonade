import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import writeFileAtomic from 'write-file-atomic'
import { PROMPTS } from '@shared/app/ipc-channels'
import type { Prompt } from '@shared/app/prompt'
import { createLogger } from '@main/logger'
import { getPromptsDir } from '@main/data-paths'

const log = createLogger('prompt-handlers')

function promptPath(id: string): string {
  return join(getPromptsDir(), `${id}.json`)
}

async function ensurePromptsDir(): Promise<void> {
  await fs.mkdir(getPromptsDir(), { recursive: true })
}

export function registerPromptHandlers(): void {
  ipcMain.handle(PROMPTS.LIST, async (): Promise<Prompt[]> => {
    await ensurePromptsDir()
    const files = await fs.readdir(getPromptsDir())
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    const prompts = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await fs.readFile(join(getPromptsDir(), f), 'utf-8')
        return JSON.parse(raw) as Prompt
      })
    )
    log.debug(`Found ${prompts.length} prompt files`)
    return prompts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  })

  ipcMain.handle(PROMPTS.SAVE, async (_event, prompt: Prompt): Promise<void> => {
    await ensurePromptsDir()
    await writeFileAtomic(promptPath(prompt.id), JSON.stringify(prompt, null, 2))
    log.debug(`Saved prompt: ${prompt.id}`)
  })

  ipcMain.handle(PROMPTS.DELETE, async (_event, id: string): Promise<void> => {
    await fs.rm(promptPath(id), { force: true })
    log.info(`Deleted prompt: ${id}`)
  })
}
