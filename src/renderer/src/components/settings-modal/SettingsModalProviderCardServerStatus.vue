<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IconPlayerPlay, IconPlayerStop, IconRefresh } from '@tabler/icons-vue'
import Button from '@renderer/components/ui/Button.vue'
import { api } from '@renderer/api'
import type { ServerStatusResponse } from '@shared/provider/ipc-contracts'
import { useModelsStore } from '@renderer/stores/models'

const modelsStore = useModelsStore()

const props = defineProps<{
  instanceId: string
}>()

const running = ref<boolean | null>(null)
const port = ref<number | null>(null)
const loading = ref(false)

const statusLabel = computed((): string => {
  if (running.value === null) return 'Checking…'
  if (running.value) return `Running ${port.value ? 'on port ' + port.value : ''}`
  return 'Not running'
})

async function withLoading(fn: () => Promise<ServerStatusResponse>): Promise<void> {
  loading.value = true
  const status = await fn()
  running.value = status.running
  port.value = status.port
  loading.value = false
}

const refresh = (): Promise<void> => withLoading(() => api.serverStatus(props.instanceId))
const start = async (): Promise<void> => {
  await withLoading(() => api.serverStart(props.instanceId))
  modelsStore.loadLocalModels()
}
const stop = async (): Promise<void> => {
  await withLoading(() => api.serverStop(props.instanceId))
  modelsStore.loadLocalModels()
}

onMounted(refresh)
</script>

<template>
  <div class="server-status">
    <span
      class="server-status__dot"
      :class="{ running: running === true, stopped: running === false }"
    />
    <span class="server-status__label">{{ statusLabel }}</span>
    <Button
      v-if="running === false"
      v-tooltip="'Start server'"
      type="icon"
      :icon="IconPlayerPlay"
      :disabled="loading"
      @click="start"
    />
    <Button
      v-if="running === true"
      v-tooltip="'Stop server'"
      type="icon"
      :icon="IconPlayerStop"
      :disabled="loading"
      @click="stop"
    />
    <Button
      v-tooltip="'Refresh status'"
      type="icon"
      :icon="IconRefresh"
      :icon-size="13"
      :disabled="loading"
      @click="refresh"
    />
  </div>
</template>

<style scoped lang="scss">
.server-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--border);
    flex-shrink: 0;

    &.running {
      background: var(--success, #4caf50);
    }

    &.stopped {
      background: var(--text-muted);
    }
  }

  &__label {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}
</style>
