import { ipcMain } from 'electron'
import { HUGGINGFACE } from '@shared/provider/ipc-channels'
import type { HuggingFaceModelDetails } from '@shared/provider/huggingface-model'
import { fetchModelDetails } from '../services/huggingface'

export function registerHuggingFaceHandlers(): void {
  ipcMain.handle(
    HUGGINGFACE.FETCH_MODEL_DETAILS,
    (_event, input: string): Promise<HuggingFaceModelDetails> => fetchModelDetails(input)
  )
}
