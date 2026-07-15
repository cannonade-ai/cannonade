<script setup lang="ts">
import { Button, Select } from '@renderer/components/ui'
import { IconRefresh, IconSettings, IconAlertCircle, IconLoader2 } from '@tabler/icons-vue'
import { computed, watch } from 'vue'
import { useShortcut } from '@renderer/composables/useShortcut'
import { formatDate } from '@renderer/utils/format'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import LocalModelCard from '@renderer/components/LocalModelCard.vue'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import type { LocalModel } from '@shared/provider/local-model'
import { useModelsStore } from '@renderer/stores/models'
import { useNavigationStore } from '@renderer/stores/navigation'
import { useProvidersStore } from '@renderer/stores/providers'

const store = useModelsStore()
const navStore = useNavigationStore()
const providersStore = useProvidersStore()

const providers = computed(() => providersStore.localProviders)

const providerOptions = computed<SelectOption<string>[]>(() =>
  providers.value.map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const providerLabel = computed(
  () =>
    providers.value.find((p) => p.instanceId === providersStore.activeLocalProvider)?.displayName ??
    ''
)

const byLoaded = (a: LocalModel, b: LocalModel): number =>
  b.loadedInstances.length - a.loadedInstances.length

const llms = computed(() => store.localModels.filter((m) => m.type === 'llm').sort(byLoaded))
const embeddings = computed(() =>
  store.localModels.filter((m) => m.type === 'embedding').sort(byLoaded)
)

const provider = computed<string>({
  get: () => providersStore.activeLocalProvider,
  set: (v) => {
    providersStore.setLocalProvider(v)
    store.loadLocalModels()
  }
})

watch(
  () => providersStore.activeLocalProvider,
  (instanceId) => {
    if (!instanceId) return
    store.loadLocalModels()
  },
  { immediate: true }
)

useShortcut('F5', () => store.loadLocalModels(), { preventDefault: true })
</script>

<template>
  <div class="models">
    <div v-if="providers.length === 0" class="no-providers">
      <IconSettings :size="24" :stroke-width="1.5" class="empty-icon" color="#ffffff30" />
      <span>No local providers configured</span>
      <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
        Configure Provider
      </Button>
    </div>

    <template v-else>
      <SectionHeader>
        <span v-if="store.localModelsUpdatedAt" v-tooltip="'Last updated'" class="updated-at">
          {{ formatDate(store.localModelsUpdatedAt, true) }}
        </span>
        <span v-if="providers.length === 1" class="provider-label">
          {{ providerLabel }}
        </span>
        <Select v-else v-model="provider" :options="providerOptions" class="provider-select" />
        <Button :disabled="store.loading" @click="store.loadLocalModels()">
          <IconLoader2 v-if="store.loading" :size="14" class="spin" />
          <IconRefresh v-else :size="14" />
          Refresh
        </Button>
      </SectionHeader>

      <div v-if="store.loading && store.localModels.length === 0" class="state-message">
        <span class="spinner" />
        Connecting to {{ providerLabel }}...
      </div>

      <div v-else-if="store.error" class="state-message error">
        <IconAlertCircle :size="16" />
        {{ store.error }}
        <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
          Configure Provider
        </Button>
      </div>

      <template v-else-if="store.localModels.length > 0">
        <section v-if="llms.length > 0" class="model-section">
          <h3 class="model-section-label">
            LLMs
            <span class="count-pill">{{ llms.length }}</span>
          </h3>
          <div class="models-grid">
            <LocalModelCard
              v-for="model in llms"
              :key="model.id"
              :model="model"
              :capabilities="providersStore.activeCapabilities"
            />
          </div>
        </section>

        <section v-if="embeddings.length > 0" class="model-section">
          <h3 class="model-section-label">
            Embedding Models
            <span class="count-pill">{{ embeddings.length }}</span>
          </h3>
          <div class="models-grid">
            <LocalModelCard
              v-for="model in embeddings"
              :key="model.id"
              :model="model"
              :capabilities="providersStore.activeCapabilities"
            />
          </div>
        </section>
      </template>

      <div v-else class="state-message">
        No models found in {{ providerLabel }}.
        <Button :icon="IconSettings" @click="navStore.openSettings('providers')">
          Configure Provider
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.models {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  > .model-section,
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

.model-section {
  margin-bottom: 32px;

  .model-section-label {
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: var(--font-headline);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    .count-pill {
      font-size: var(--text-xs);
      background: var(--surface-elevated);
      color: var(--text-muted);
      padding: 1px 6px;
      border-radius: var(--radius-full);
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }
  }

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 12px;
  }
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
