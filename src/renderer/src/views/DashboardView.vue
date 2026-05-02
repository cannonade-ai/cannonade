<script setup lang="ts">
import { Button, Select } from '@renderer/components/ui'
import { IconRefresh } from '@tabler/icons-vue'
import { computed, onMounted } from 'vue'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import ModelCard from '@renderer/components/ModelCard.vue'
import OpenRouterModelCard from '@renderer/components/OpenRouterModelCard.vue'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import type { Provider } from '@renderer/stores/models'
import { useModelsStore } from '@renderer/stores/models'

const store = useModelsStore()

const providerOptions: SelectOption<Provider>[] = [
  { value: 'lmstudio', label: 'LM Studio' },
  { value: 'openrouter', label: 'OpenRouter' }
]

const byLoaded = (a: { loaded_instances: unknown[] }, b: { loaded_instances: unknown[] }): number =>
  b.loaded_instances.length - a.loaded_instances.length

const llms = computed(() => store.lmModels.filter((m) => m.type === 'llm').sort(byLoaded))
const embeddings = computed(() =>
  store.lmModels.filter((m) => m.type === 'embedding').sort(byLoaded)
)

const providerLabel = computed(() => (store.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'))

const provider = computed<Provider>({
  get: () => store.provider,
  set: (v) => {
    store.provider = v
    store.load()
  }
})

onMounted(() => store.load())
</script>

<template>
  <div class="dashboard">
    <SectionHeader>
      <Select v-model="provider" :options="providerOptions" class="provider-select" />
      <Button :icon="IconRefresh" @click="store.load()">Refresh</Button>
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

    <template v-else-if="store.provider === 'lmstudio' && store.lmModels.length > 0">
      <section v-if="llms.length > 0" class="model-section">
        <h3 class="model-section-label">
          LLMs
          <span class="count-pill">{{ llms.length }}</span>
        </h3>
        <div class="models-grid">
          <ModelCard v-for="model in llms" :key="model.key" :model="model" />
        </div>
      </section>

      <section v-if="embeddings.length > 0" class="model-section">
        <h3 class="model-section-label">
          Embedding Models
          <span class="count-pill">{{ embeddings.length }}</span>
        </h3>
        <div class="models-grid">
          <ModelCard v-for="model in embeddings" :key="model.key" :model="model" />
        </div>
      </section>
    </template>

    <template v-else-if="store.provider === 'openrouter' && store.orModels.length > 0">
      <section class="model-section">
        <h3 class="model-section-label">
          Models
          <span class="count-pill">{{ store.orModels.length }}</span>
        </h3>
        <div class="models-grid">
          <OpenRouterModelCard v-for="model in store.orModels" :key="model.id" :model="model" />
        </div>
      </section>
    </template>

    <div v-else class="state-message">
      No models found. Make sure {{ providerLabel }} is running{{
        store.provider === 'lmstudio' ? ' on port 1234' : ' on port 3000'
      }}.
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
