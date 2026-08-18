<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconCircleArrowUp, IconExternalLink } from '@tabler/icons-vue'
import Badge from '@renderer/components/ui/Badge.vue'
import Button from '@renderer/components/ui/Button.vue'
import Modal from '@renderer/components/ui/Modal.vue'
import { useUpdaterStore } from '@renderer/stores/updater'
import { CHANGELOG_URL } from '@shared/app/update-info'

const updater = useUpdaterStore()
const open = ref(false)

const badgeLabel = computed(() => {
  if (updater.isReady) return 'Update ready'
  if (updater.isDownloading) return `Downloading ${updater.percent}%`
  return 'Update available'
})

function openChangelog(): void {
  window.open(CHANGELOG_URL)
}
</script>

<template>
  <button v-if="updater.hasUpdate" class="update-trigger" @click="open = true">
    <Badge type="secondary">{{ badgeLabel }}</Badge>
  </button>

  <Modal v-model="open" title="Update Available" size="sm">
    <div class="versions">
      <div class="version-item">
        <span class="version-label">Current</span>
        <span class="version-value">{{ updater.currentVersion }}</span>
      </div>
      <IconCircleArrowUp :size="16" class="version-arrow" />
      <div class="version-item">
        <span class="version-label">Latest</span>
        <span class="version-value is-latest">{{ updater.latestVersion }}</span>
      </div>
    </div>

    <button class="changelog-link" @click="openChangelog">
      View changelog
      <IconExternalLink :size="13" />
    </button>

    <div v-if="updater.isDownloading || updater.isReady" class="progress">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${updater.percent}%` }" />
      </div>
      <span class="progress-text">
        {{ updater.isReady ? 'Download complete' : `Downloading ${updater.percent}%` }}
      </span>
    </div>

    <p v-if="updater.hasError" class="update-error">{{ updater.error }}</p>

    <template #actions="{ close }">
      <Button :disabled="updater.isDownloading" @click="close">Cancel</Button>
      <Button v-if="updater.isReady" type="primary" @click="updater.install()">
        Restart to apply
      </Button>
      <Button v-else type="primary" :disabled="updater.isDownloading" @click="updater.download()">
        {{ updater.hasError ? 'Retry' : 'Update' }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.update-trigger {
  display: inline-flex;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  -webkit-app-region: no-drag;

  :deep(.badge) {
    font-weight: 400;
  }
}

.versions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0 0.75rem;
}

.version-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.version-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.version-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);

  &.is-latest {
    color: var(--accent);
    font-weight: 600;
  }
}

.version-arrow {
  color: var(--text-muted);
  transform: rotate(90deg);
}

.changelog-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: var(--text-xs);
  color: var(--accent);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 1rem;
}

.progress-track {
  height: 4px;
  background: var(--surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: width 0.2s var(--ease-out);
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.update-error {
  margin-top: 0.75rem;
  font-size: var(--text-xs);
  color: var(--error);
}
</style>
