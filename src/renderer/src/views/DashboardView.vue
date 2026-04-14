<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useModelsStore } from '../stores/models'
import type { Provider } from '../stores/models'
import ModelCard from '../components/ModelCard.vue'
import OpenRouterModelCard from '../components/OpenRouterModelCard.vue'

const store = useModelsStore()

const llms = computed(() => store.lmModels.filter((m) => m.type === 'llm'))
const embeddings = computed(() => store.lmModels.filter((m) => m.type === 'embedding'))

const providerLabel = computed(() => (store.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'))

function onProviderChange(e: Event): void {
  store.provider = (e.target as HTMLSelectElement).value as Provider
  store.load()
}

onMounted(() => store.load())
</script>

<template>
  <div class="dashboard">
    <div class="section-header">
      <h2 class="section-title">Models</h2>
      <div class="section-actions">
        <select class="provider-select" :value="store.provider" @change="onProviderChange">
          <option value="lmstudio">LM Studio</option>
          <option value="openrouter">OpenRouter</option>
        </select>
        <span v-if="!store.loading && !store.error" class="model-count">
          {{ store.provider === 'lmstudio' ? store.lmModels.length : store.orModels.length }}
          model{{
            (store.provider === 'lmstudio' ? store.lmModels.length : store.orModels.length) !== 1
              ? 's'
              : ''
          }}
        </span>
        <button class="btn-refresh" :disabled="store.loading" @click="store.load()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ spinning: store.loading }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

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

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-select {
  appearance: none;
  padding: 6px 28px 6px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23767575' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background-color 0.15s;
  outline: none;
}

.provider-select:hover {
  border-color: var(--border-hover);
  background-color: var(--surface-hover);
}

.provider-select:focus {
  border-color: var(--accent);
}

.model-count {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.model-section {
  margin-bottom: 32px;
}

.model-section-label {
  font-size: 0.78rem;
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-pill {
  font-size: 0.7rem;
  background: var(--surface-elevated);
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.state-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 40px 0;
}

.state-message.error {
  color: var(--error);
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
