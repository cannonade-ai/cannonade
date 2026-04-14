<script setup lang="ts">
import { computed } from 'vue'
import type { Model } from '@shared/open-router/ipc-contracts'
import { formatContext } from '../utils/format'

const props = defineProps<{ model: Model }>()

const publisher = computed(() => props.model.id.split('/')[0] ?? props.model.id)

function formatPrice(raw: string): string {
  const n = parseFloat(raw)
  if (n === 0) return 'free'
  const perMillion = n * 1_000_000
  return `$${perMillion % 1 === 0 ? perMillion.toFixed(0) : perMillion.toPrecision(3)}/M`
}
</script>

<template>
  <div class="or-card">
    <div class="card-header">
      <h3 class="model-name">{{ model.name }}</h3>
      <span class="modality-badge">{{ model.architecture.modality }}</span>
    </div>

    <div class="card-meta">
      <span class="publisher">{{ publisher }}</span>
      <span v-if="model.architecture.tokenizer" class="badge">{{
        model.architecture.tokenizer
      }}</span>
    </div>

    <div class="card-stats">
      <div class="stat">
        <span class="stat-label">Context</span>
        <span class="stat-value">{{ formatContext(model.context_length) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Prompt</span>
        <span class="stat-value">{{ formatPrice(model.pricing.prompt) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Completion</span>
        <span class="stat-value">{{ formatPrice(model.pricing.completion) }}</span>
      </div>
      <div v-if="model.top_provider.max_completion_tokens" class="stat">
        <span class="stat-label">Max out</span>
        <span class="stat-value">{{
          formatContext(model.top_provider.max_completion_tokens)
        }}</span>
      </div>
    </div>

    <p v-if="model.description" class="description">{{ model.description }}</p>
  </div>
</template>

<style scoped>
.or-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.or-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 4px 16px var(--shadow);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.model-name {
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.modality-badge {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--blue-dim);
  color: var(--blue);
  letter-spacing: 0.03em;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.publisher {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius);
  letter-spacing: 0.04em;
  background: var(--accent-dim);
  color: var(--accent);
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
  padding: 8px 10px;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.description {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
