<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconRefresh, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-vue'
import { useSettingsStore } from '@renderer/stores/settings'
import { useModelsStore } from '@renderer/stores/models'
import { api } from '@renderer/api'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import NumberInput from '@renderer/components/ui/NumberInput.vue'
import Button from '@renderer/components/ui/Button.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'

const settings = useSettingsStore()
const modelsStore = useModelsStore()

const capabilities = ref<ProviderCapabilities | null>(null)
const serverRunning = ref<boolean | null>(null)
const serverPort = ref<number | null>(null)
const serverLoading = ref(false)

async function refreshServerStatus(): Promise<void> {
  serverLoading.value = true
  const status = await api.serverStatus('lmstudio')
  serverRunning.value = status.running
  serverPort.value = status.port
  serverLoading.value = false
}

async function startServer(): Promise<void> {
  serverLoading.value = true
  const status = await api.serverStart('lmstudio')
  serverRunning.value = status.running
  serverPort.value = status.port
  serverLoading.value = false
}

async function stopServer(): Promise<void> {
  serverLoading.value = true
  const status = await api.serverStop('lmstudio')
  serverRunning.value = status.running
  serverPort.value = status.port
  serverLoading.value = false
}

onMounted(async () => {
  capabilities.value = await modelsStore.getCapabilities('lmstudio')
  refreshServerStatus()
})
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="LM Studio" />
    <SettingsModalRow label="Port" hint="Local LM Studio server port">
      <NumberInput
        :model-value="settings.lmStudioPort"
        :min="1"
        :max="65535"
        align-right
        class="input-sm"
        @update:model-value="
          (v) => {
            if (v !== undefined) settings.lmStudioPort = v
          }
        "
      />
    </SettingsModalRow>
    <template v-if="capabilities?.serverControl">
      <SettingsModalRow label="Server">
        <div class="server-controls">
          <span
            class="status-dot"
            :class="{ running: serverRunning === true, stopped: serverRunning === false }"
          />
          <span class="status-label">
            <template v-if="serverRunning === null">Checking…</template>
            <template v-else-if="serverRunning">Running on port {{ serverPort }}</template>
            <template v-else>Not running</template>
          </span>
          <Button
            v-if="serverRunning === false"
            :icon="IconPlayerPlay"
            :disabled="serverLoading"
            @click="startServer"
          >
            Start
          </Button>
          <Button
            v-if="serverRunning === true"
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
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.input-sm {
  width: 100px;
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
