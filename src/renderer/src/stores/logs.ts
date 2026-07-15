import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LogEntry } from '@shared/app/logging'
import { api } from '@renderer/api'
import { createLogger } from '@renderer/utils/logger'

const MAX_ENTRIES = 1000
const log = createLogger('logs-store')

export const useLogsStore = defineStore('logs', () => {
  const entries = ref<LogEntry[]>([])
  let initialized = false

  function append(entry: LogEntry): void {
    entries.value.push(entry)
    if (entries.value.length > MAX_ENTRIES) entries.value.shift()
  }

  async function init(): Promise<void> {
    if (initialized) return
    initialized = true
    api.onLogEntry(append)
    try {
      const buffered = await api.listLogs()
      const lastBufferedSeq = buffered.length > 0 ? buffered[buffered.length - 1].seq : -1
      const live = entries.value.filter((entry) => entry.seq > lastBufferedSeq)
      entries.value = [...buffered, ...live].slice(-MAX_ENTRIES)
    } catch (error) {
      log.error('Failed to load buffered logs:', error)
    }
  }

  return { entries, init }
})
