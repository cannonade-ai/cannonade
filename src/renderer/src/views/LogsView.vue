<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { IconFolderOpen, IconTrash } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { LOG_LEVELS, type LogEntry, type LogFile, type LogLevel } from '@shared/app/logging'
import { Badge, Button, Input, InfoTooltip, Panel, Select } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { useLogsStore } from '@renderer/stores/logs'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useToastStore } from '@renderer/stores/toast'
import { formatBytes } from '@renderer/utils/format'
import { api } from '@renderer/api'
import { createLogger } from '@renderer/utils/logger'

type LevelFilter = LogLevel | 'all'

const CURRENT_SESSION = 'current'
const log = createLogger('logs-view')

const logs = useLogsStore()
const confirmStore = useConfirmStore()
const toastStore = useToastStore()
const { entries } = storeToRefs(logs)

const search = ref('')
const levelFilter = ref<LevelFilter>('all')
const selectedSource = ref<string>(CURRENT_SESSION)
const logFiles = ref<LogFile[]>([])
const fileEntries = ref<LogEntry[]>([])
const listRef = ref<HTMLElement | null>(null)

const levelOptions: SelectOption<LevelFilter>[] = [
  { value: 'all', label: 'All levels' },
  ...LOG_LEVELS.map((level) => ({
    value: level,
    label: level === 'error' ? 'Error' : `${level.charAt(0).toUpperCase()}${level.slice(1)} & above`
  }))
]

const sourceOptions = computed<SelectOption[]>(() => [
  { value: CURRENT_SESSION, label: 'Current session' },
  ...logFiles.value.map((file) => ({
    value: file.name,
    label: `${file.name} (${formatBytes(file.sizeBytes)})`
  }))
])

const isCurrentSession = computed(() => selectedSource.value === CURRENT_SESSION)

const sourceEntries = computed<LogEntry[]>(() =>
  isCurrentSession.value ? entries.value : fileEntries.value
)

const filteredEntries = computed<LogEntry[]>(() => {
  const query = search.value.trim().toLowerCase()
  const maxSeverity = levelFilter.value === 'all' ? -1 : LOG_LEVELS.indexOf(levelFilter.value)
  return sourceEntries.value.filter((entry) => {
    if (maxSeverity >= 0 && LOG_LEVELS.indexOf(entry.level) > maxSeverity) return false
    if (!query) return true
    return entry.message.toLowerCase().includes(query) || entry.scope.toLowerCase().includes(query)
  })
})

async function loadLogFiles(): Promise<void> {
  try {
    logFiles.value = await api.listLogFiles()
  } catch (error) {
    log.error('Failed to list log files:', error)
  }
}

watch(selectedSource, async (source) => {
  if (source === CURRENT_SESSION) {
    fileEntries.value = []
  } else {
    try {
      fileEntries.value = await api.readLogFile(source)
    } catch (error) {
      fileEntries.value = []
      log.error('Failed to read log file:', error)
      toastStore.error(`Failed to read log file "${source}"`)
    }
  }
  await nextTick()
  scrollToBottom()
})

async function deleteSelectedFile(): Promise<void> {
  const name = selectedSource.value
  const ok = await confirmStore.confirm({
    title: 'Delete Log File',
    message: `Delete "${name}"? This cannot be undone.`,
    confirmText: 'Delete',
    danger: true
  })
  if (!ok) return
  try {
    await api.deleteLogFile(name)
    selectedSource.value = CURRENT_SESSION
    await loadLogFiles()
  } catch (error) {
    log.error('Failed to delete log file:', error)
    toastStore.error(`Failed to delete log file "${name}"`)
  }
}

async function deleteLogHistory(): Promise<void> {
  const ok = await confirmStore.confirm({
    title: 'Delete Log History',
    message: `Delete all ${logFiles.value.length} archived log files? The current session is not affected. This cannot be undone.`,
    confirmText: 'Delete All',
    danger: true
  })
  if (!ok) return
  try {
    await Promise.all(logFiles.value.map((file) => api.deleteLogFile(file.name)))
    selectedSource.value = CURRENT_SESSION
    toastStore.success('Log history deleted')
  } catch (error) {
    log.error('Failed to delete log history:', error)
    toastStore.error('Failed to delete log history')
  }
  await loadLogFiles()
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const pad = (value: number, length = 2): string => String(value).padStart(length, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

function isAtBottom(): boolean {
  const el = listRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 40
}

function scrollToBottom(): void {
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(
  () => filteredEntries.value.length,
  async () => {
    const stick = isAtBottom()
    await nextTick()
    if (stick) scrollToBottom()
  }
)

onMounted(async () => {
  await Promise.all([logs.init(), loadLogFiles()])
  await nextTick()
  scrollToBottom()
})

async function openLogsFolder(): Promise<void> {
  const dir = await api.getLogsDir()
  await api.openPath(dir)
}
</script>

<template>
  <div class="view">
    <SectionHeader>
      <Button
        type="danger-outline"
        :icon="IconTrash"
        :disabled="logFiles.length === 0"
        @click="deleteLogHistory"
      >
        Delete Log History
      </Button>
    </SectionHeader>
    <Panel class="logs-panel" title="Logs">
      <template #title-addon>
        <Badge>{{ filteredEntries.length }}</Badge>
        <InfoTooltip
          content="Live application logs from the main and renderer processes. Entries below the log level configured in Settings are not captured."
        />
      </template>
      <template #header-right>
        <Button v-tooltip="'Open logs folder'" type="icon" @click="openLogsFolder">
          <IconFolderOpen :size="15" />
        </Button>
      </template>
      <template #toolbar-left>
        <Input v-model="search" class="search-input" type="search" placeholder="Search logs…" />
      </template>
      <template #toolbar-right>
        <Select v-model="selectedSource" class="source-select" :options="sourceOptions" />
        <Select v-model="levelFilter" class="level-select" :options="levelOptions" />
        <Button
          v-tooltip="'Delete this log file'"
          type="icon"
          :disabled="isCurrentSession"
          @click="deleteSelectedFile"
        >
          <IconTrash :size="15" />
        </Button>
      </template>

      <div ref="listRef" class="log-list">
        <div v-if="filteredEntries.length === 0" class="log-empty">
          {{
            entries.length === 0 ? 'No log entries yet.' : 'No entries match the current filters.'
          }}
        </div>
        <div v-for="entry in filteredEntries" :key="entry.seq" class="log-row">
          <span class="log-time">{{ formatTimestamp(entry.timestamp) }}</span>
          <span class="log-level" :class="`log-level--${entry.level}`">{{ entry.level }}</span>
          <span class="log-scope">{{ entry.scope }}</span>
          <span class="log-message">{{ entry.message }}</span>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.logs-panel {
  flex: 1;

  :deep(.panel__body) {
    padding: 0;
    overflow: hidden;
  }
}

.search-input {
  width: 16rem;
}

.source-select {
  width: 14rem;
}

.level-select {
  width: 9.5rem;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.log-empty {
  padding: 24px 14px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
}

.log-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 2px 14px;

  &:hover {
    background: var(--surface-hover);
  }
}

.log-time {
  color: var(--text-muted);
  flex-shrink: 0;
}

.log-level {
  flex-shrink: 0;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-muted);

  &--error {
    color: var(--error);
  }

  &--warn {
    color: var(--accent);
  }

  &--info {
    color: var(--blue);
  }
}

.log-scope {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.log-message {
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  min-width: 0;
}
</style>
