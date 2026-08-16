<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import { useAppInfoStore } from '@renderer/stores/app-info'
import Button from '@renderer/components/ui/Button.vue'
import Select, { type SelectOption } from '@renderer/components/ui/Select.vue'
import { useConfirmStore } from '@renderer/stores/confirm'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'
import { IconFolderOpen } from '@tabler/icons-vue'
import { api } from '@renderer/api'
import { LOG_LEVELS, type LogLevel } from '@shared/app/logging'

const logLevelOptions: SelectOption<LogLevel>[] = LOG_LEVELS.map((level) => ({
  value: level,
  label: level.charAt(0).toUpperCase() + level.slice(1)
}))

const settings = useSettingsStore()
const appInfo = useAppInfoStore()
const confirmStore = useConfirmStore()

async function openSuitesFolder(): Promise<void> {
  if (appInfo.suitesDir) await api.openPath(appInfo.suitesDir)
}

function openGithubIssues(): void {
  window.open('https://github.com/cannonade-ai/cannonade/issues')
}

async function handleReset(): Promise<void> {
  const ok = await confirmStore.confirm({
    title: 'Reset All Settings',
    message: 'Are you sure you want to reset all settings? This action cannot be undone.',
    confirmText: 'Reset',
    danger: true
  })
  if (ok) settings.reset()
}
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="Version" />
    <SettingsModalRow label="Cannonade">
      <span class="mono-val">{{ appInfo.version || '—' }}</span>
    </SettingsModalRow>
    <SettingsModalDivider label="Files" />
    <SettingsModalRow label="Suites folder" hint="Where test suite files are stored on disk">
      <div class="path-row">
        <span class="path-value">{{ appInfo.suitesDir }}</span>
        <Button
          v-tooltip="'Open suites folder'"
          type="icon"
          :icon="IconFolderOpen"
          @click="openSuitesFolder"
        />
      </div>
    </SettingsModalRow>
    <SettingsModalDivider label="Logs" />
    <SettingsModalRow
      label="Log level"
      hint="Minimum level of messages written to the log file and console"
    >
      <Select v-model="settings.logLevel" :options="logLevelOptions" class="select-sm" />
    </SettingsModalRow>
    <SettingsModalDivider label="Resources" />
    <SettingsModalRow label="Report an issue">
      <Button @click="openGithubIssues"> GitHub ↗ </Button>
    </SettingsModalRow>
    <SettingsModalDivider label="Danger zone" />
    <SettingsModalRow
      label="Reset all settings"
      hint="Clears all stored preferences and restores defaults"
    >
      <Button type="danger-outline" @click="handleReset"> Reset </Button>
    </SettingsModalRow>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.select-sm {
  width: 120px;
}

.mono-val {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.path-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.path-value {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-muted);
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
}
</style>
