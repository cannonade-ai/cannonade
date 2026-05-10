<script setup lang="ts">
import { Button, Select } from '@renderer/components/ui'
import { IconRefresh } from '@tabler/icons-vue'
import { computed, onMounted, ref } from 'vue'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import LocalModelCard from '@renderer/components/LocalModelCard.vue'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import type { LocalProviderId } from '@shared/provider/ids'
import type { LocalModel } from '@shared/provider/local-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import { useModelsStore } from '@renderer/stores/models'

const store = useModelsStore()
const capabilities = ref<ProviderCapabilities | null>(null)

const providerOptions: SelectOption<LocalProviderId>[] = [{ value: 'lmstudio', label: 'LM Studio' }]

const byLoaded = (a: LocalModel, b: LocalModel): number =>
  b.loadedInstances.length - a.loadedInstances.length

const llms = computed(() => store.localModels.filter((m) => m.type === 'llm').sort(byLoaded))
const embeddings = computed(() =>
  store.localModels.filter((m) => m.type === 'embedding').sort(byLoaded)
)

const providerLabel = computed(() =>
  store.localProvider === 'lmstudio' ? 'LM Studio' : store.localProvider
)

const provider = computed<LocalProviderId>({
  get: () => store.localProvider,
  set: (v) => {
    store.localProvider = v
    store.loadLocalModels()
    store.getCapabilities(v).then((caps) => {
      capabilities.value = caps
    })
  }
})

onMounted(() => {
  store.loadLocalModels()
  store.getCapabilities(store.localProvider).then((caps) => {
    capabilities.value = caps
  })
})
</script>

<template>
  <div class="models">
    <SectionHeader>
      <Select v-model="provider" :options="providerOptions" class="provider-select" />
      <Button :icon="IconRefresh" @click="store.loadLocalModels()">Refresh</Button>
    </SectionHeader>

    <div v-if="store.loading" class="state-message">
      <span class="spinner" />
      Connecting to {{ providerLabel }}…
    </div>

    <div v-else-if="store.error" class="state-message error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ store.error }}
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
            :capabilities="capabilities"
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
            :capabilities="capabilities"
          />
        </div>
      </section>
    </template>

    <div v-else class="state-message">
      No models found. Make sure {{ providerLabel }} is running.
    </div>
  </div>
</template>

<style scoped lang="scss">
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
