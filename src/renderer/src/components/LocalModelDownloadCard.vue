<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertTriangle, IconCircleCheck, IconCloudDownload, IconX } from '@tabler/icons-vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import { formatBytes } from '../utils/format'
import type { ModelDownload } from '@renderer/stores/model-downloads'

const props = defineProps<{
  download: ModelDownload
}>()

defineEmits<{
  dismiss: []
}>()

const percent = computed<number>(() => {
  if (!props.download.totalBytes) return 0
  return Math.min(100, (props.download.downloadedBytes / props.download.totalBytes) * 100)
})

const progressLabel = computed<string>(() => {
  if (props.download.status === 'completed') return 'Completed'
  if (props.download.status === 'failed') return props.download.error ?? 'Failed'
  if (!props.download.totalBytes) return 'Starting...'
  return `${formatBytes(props.download.downloadedBytes)} / ${formatBytes(props.download.totalBytes)}`
})
</script>

<template>
  <div class="download-card" :class="download.status">
    <div class="card-header">
      <IconCircleCheck v-if="download.status === 'completed'" :size="14" class="status-icon" />
      <IconAlertTriangle v-else-if="download.status === 'failed'" :size="14" class="status-icon" />
      <IconCloudDownload v-else :size="14" class="status-icon" />
      <span v-tooltip="download.label" class="download-label">{{ download.label }}</span>
      <Badge v-if="download.quantization" type="secondary">{{ download.quantization }}</Badge>
      <Button
        v-if="download.status === 'completed' || download.status === 'failed'"
        type="icon"
        :icon="IconX"
        @click="$emit('dismiss')"
      />
    </div>

    <div class="progress-track">
      <div class="progress-bar" :style="{ width: `${percent}%` }" />
    </div>

    <div class="card-footer">
      <span class="progress-label">{{ progressLabel }}</span>
      <span
        v-if="download.totalBytes && download.status === 'downloading'"
        class="progress-percent"
      >
        {{ percent.toFixed(0) }}%
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);

  &.failed {
    border-color: var(--error);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .download-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .base-btn {
    margin-left: auto;
  }
}

.download-card.completed .status-icon {
  color: var(--green);
}

.download-card.failed .status-icon {
  color: var(--error);
}

.progress-track {
  height: 4px;
  background: var(--surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.download-card.failed .progress-bar {
  background: var(--error);
}

.download-card.completed .progress-bar {
  background: var(--green);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
