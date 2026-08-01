<script setup lang="ts">
import { computed } from 'vue'
import { CopyButton, Modal } from '@renderer/components/ui'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'

const viewStore = useExternalModelsViewStore()

const open = computed<boolean>({
  get: () => viewStore.rawJsonModel !== null,
  set: (value) => {
    if (!value) viewStore.rawJsonModel = null
  }
})

const title = computed<string>(() => viewStore.rawJsonModel?.name ?? '')

const formatted = computed<string>(() =>
  viewStore.rawJsonModel ? JSON.stringify(viewStore.rawJsonModel.raw, null, 2) : ''
)
</script>

<template>
  <Modal v-model="open" :title="title" size="lg">
    <CopyButton :value="formatted">
      <pre class="raw-json">{{ formatted }}</pre>
    </CopyButton>
  </Modal>
</template>

<style scoped lang="scss">
.raw-json {
  margin: 0;
  padding: 12px;
  max-height: 60vh;
  overflow: auto;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  white-space: pre;
}
</style>
