<script setup lang="ts">
import { Button, Select } from '@renderer/components/ui'
import { IconRefresh, IconSettings, IconAlertCircle, IconKey, IconLoader2 } from '@tabler/icons-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useShortcut } from '@renderer/composables/useShortcut'
import { formatDate } from '@renderer/utils/format'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import ExternalModelTable from '@renderer/components/external-models/ExternalModelTable.vue'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import { useModelsStore } from '@renderer/stores/models'
import { useNavigationStore } from '@renderer/stores/navigation'
import { useProvidersStore } from '@renderer/stores/providers'

const store = useModelsStore()
const navStore = useNavigationStore()
const providersStore = useProvidersStore()
const viewStore = useExternalModelsViewStore()

const rootEl = ref<HTMLElement | null>(null)

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

onMounted(async () => {
  await nextTick()
  const scroller = findScrollParent(rootEl.value)
  if (scroller) scroller.scrollTop = viewStore.scrollTop
})

onBeforeUnmount(() => {
  const scroller = findScrollParent(rootEl.value)
  if (scroller) viewStore.scrollTop = scroller.scrollTop
})

const providers = computed(() => providersStore.externalProviders)

const providerOptions = computed<SelectOption<string>[]>(() =>
  providers.value.map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const activeProvider = computed(() =>
  providers.value.find((p) => p.instanceId === providersStore.activeExternalProvider)
)

const providerLabel = computed(() => activeProvider.value?.displayName ?? '')

const missingApiKey = computed(() => {
  const provider = activeProvider.value
  return (
    provider !== undefined && (provider.authMethod === undefined || provider.authMethod === 'none')
  )
})

const provider = computed<string>({
  get: () => providersStore.activeExternalProvider,
  set: (v) => {
    providersStore.setExternalProvider(v)
    store.loadExternalModels()
  }
})

watch(
  () => providersStore.activeExternalProvider,
  (instanceId) => {
    if (!instanceId) return
    store.loadExternalModels()
  },
  { immediate: true }
)

useShortcut('F5', () => store.loadExternalModels(true), { preventDefault: true })
</script>

<template>
  <div ref="rootEl" class="external-models">
    <div v-if="providers.length === 0" class="no-providers">
      <IconSettings :size="24" :stroke-width="1.5" class="empty-icon" color="#ffffff30" />
      <span>No external providers configured</span>
      <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
        Configure Provider
      </Button>
    </div>

    <template v-else>
      <SectionHeader>
        <span v-if="store.externalModelsUpdatedAt" v-tooltip="'Last updated'" class="updated-at">
          {{ formatDate(store.externalModelsUpdatedAt, true) }}
        </span>
        <span v-if="providers.length === 1" class="provider-label">
          {{ providerLabel }}
        </span>
        <Select v-else v-model="provider" :options="providerOptions" class="provider-select" />
        <Button :disabled="store.loading" @click="store.loadExternalModels(true)">
          <IconLoader2 v-if="store.loading" :size="14" class="spin" />
          <IconRefresh v-else :size="14" />
          Refresh
        </Button>
      </SectionHeader>

      <div v-if="missingApiKey" class="key-notice">
        <IconKey :size="14" />
        No API key configured for {{ providerLabel }}. You can browse the catalog, but chat and test
        runs need a key.
        <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
          Configure Provider
        </Button>
      </div>

      <div v-if="store.loading && store.externalModels.length === 0" class="state-message">
        <span class="spinner" />
        Loading models from {{ providerLabel }}...
      </div>

      <div v-else-if="store.error" class="state-message error">
        <IconAlertCircle :size="16" />
        {{ store.error }}
        <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
          Configure Provider
        </Button>
      </div>

      <ExternalModelTable
        v-else-if="store.externalModels.length > 0"
        :models="store.externalModels"
      />

      <div v-else class="state-message">
        No models found in {{ providerLabel }}.
        <Button :icon="IconRefresh" @click="store.loadExternalModels(true)">Refresh</Button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.external-models {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  > .key-notice,
  > .state-message {
    flex-shrink: 0;
  }
}

.no-providers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.provider-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
}

.updated-at {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
}

.provider-select {
  width: auto;
  font-size: var(--text-xs);
  background: var(--surface);
}

.key-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 16px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.state-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: var(--text-sm);
  padding: 40px 0;

  &.error {
    color: var(--error);
  }
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
</style>
