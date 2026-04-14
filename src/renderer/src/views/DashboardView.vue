<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useModelsStore } from '../stores/models'
import ModelCard from '../components/ModelCard.vue'

const store = useModelsStore()

const llms = computed(() => store.models.filter(m => m.type === 'llm'))
const embeddings = computed(() => store.models.filter(m => m.type === 'embedding'))

onMounted(() => store.load())
</script>

<template>
  <div class="dashboard">
    <div class="section-header">
      <h2 class="section-title">Models</h2>
      <div class="section-actions">
        <span v-if="!store.loading && !store.error" class="model-count">
          {{ store.models.length }} model{{ store.models.length !== 1 ? 's' : '' }}
        </span>
        <button
          class="btn-refresh"
          :disabled="store.loading"
          @click="store.load()"
        >
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
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="store.loading" class="state-message">
      <span class="spinner" />
      Connecting to LM Studio…
    </div>

    <div v-else-if="store.error" class="state-message error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ store.error }}
    </div>

    <template v-else-if="store.models.length > 0">
      <section v-if="llms.length > 0" class="model-section">
        <h3 class="model-section-label">
          LLMs
          <span class="count-pill">{{ llms.length }}</span>
        </h3>
        <div class="models-grid">
          <ModelCard
            v-for="model in llms"
            :key="model.key"
            :model="model"
          />
        </div>
      </section>

      <section v-if="embeddings.length > 0" class="model-section">
        <h3 class="model-section-label">
          Embedding Models
          <span class="count-pill">{{ embeddings.length }}</span>
        </h3>
        <div class="models-grid">
          <ModelCard
            v-for="model in embeddings"
            :key="model.key"
            :model="model"
          />
        </div>
      </section>
    </template>

    <div v-else class="state-message">
      No models found. Make sure LM Studio is running on port 1234.
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
  transition: background 0.15s, color 0.15s, border-color 0.15s;
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
  to { transform: rotate(360deg); }
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
