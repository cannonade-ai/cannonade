<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { IconRefresh, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-vue'
import { useSettingsStore } from '@renderer/stores/settings'
import { useModelsStore } from '@renderer/stores/models'
import { api } from '@renderer/api'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import type { ServerStatusResponse } from '@shared/lm-studio/ipc-contracts'
import Toggle from '@renderer/components/ui/Toggle.vue'
import Input from '@renderer/components/ui/Input.vue'
import Button from '@renderer/components/ui/Button.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'
import SettingsModalOllama from './SettingsModalOllama.vue'

const settings = useSettingsStore()
const modelsStore = useModelsStore()

const capabilities = ref<ProviderCapabilities | null>(null)
const serverStatus = ref<ServerStatusResponse | null>(null)
const serverLoading = ref(false)
const lmStudioUrlInput = ref(settings.lmStudioUrl)

watch(lmStudioUrlInput, (value) => {
  try {
    new URL(value)
    settings.lmStudioUrl = value
  } catch {
    /* invalid url */
  }
})

async function withLoading(fn: () => Promise<ServerStatusResponse>): Promise<void> {
  serverLoading.value = true
  serverStatus.value = await fn()
  serverLoading.value = false
}

const refreshServerStatus = (): Promise<void> => withLoading(() => api.serverStatus('lmstudio'))
const startServer = (): Promise<void> => withLoading(() => api.serverStart('lmstudio'))
const stopServer = (): Promise<void> => withLoading(() => api.serverStop('lmstudio'))

watch(
  () => settings.lmStudioRemote,
  (remote) => {
    if (!remote) refreshServerStatus()
  }
)

onMounted(async () => {
  capabilities.value = await modelsStore.getCapabilities('lmstudio')
  if (!settings.lmStudioRemote) refreshServerStatus()
})
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="LM Studio" />
    <SettingsModalRow label="API URL" hint="LM Studio server URL">
      <Input
        v-model="lmStudioUrlInput"
        type="url"
        placeholder="http://localhost:1234"
        class="input-url"
      />
    </SettingsModalRow>
    <SettingsModalRow label="Remote server" hint="Connect to LM Studio on another device">
      <Toggle v-model="settings.lmStudioRemote" />
    </SettingsModalRow>
    <template v-if="capabilities?.serverControl && !settings.lmStudioRemote">
      <SettingsModalRow label="Server">
        <div class="server-controls">
          <span
            class="status-dot"
            :class="{
              running: serverStatus?.running === true,
              stopped: serverStatus?.running === false
            }"
          />
          <span class="status-label">
            <template v-if="serverStatus === null">Checking…</template>
            <template v-else-if="serverStatus.running">
              Running on port {{ serverStatus.port }}
            </template>
            <template v-else>Not running</template>
          </span>
          <Button
            v-if="serverStatus?.running === false"
            :icon="IconPlayerPlay"
            :disabled="serverLoading"
            @click="startServer"
          >
            Start
          </Button>
          <Button
            v-if="serverStatus?.running === true"
            :icon="IconPlayerStop"
            :disabled="serverLoading"
            @click="stopServer"
          >
            Stop
          </Button>
          <Button
            type="icon"
            :icon="IconRefresh"
            :disabled="serverLoading"
            @click="refreshServerStatus"
          />
        </div>
      </SettingsModalRow>
    </template>
  </div>
  <SettingsModalOllama />
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.input-url {
  width: 250px;
}

.server-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-faint);
  flex-shrink: 0;

  &.running {
    background: var(--green);
  }

  &.stopped {
    background: var(--error);
  }
}

.status-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
