<script setup lang="ts">
import { computed } from 'vue'
import { formatContext, formatPrice } from '../utils/format'
import Badge from './ui/Badge.vue'
import type { ExternalModel } from '@shared/provider/external-model'

const props = defineProps<{ model: ExternalModel }>()

const publisher = computed(() => props.model.id.split('/')[0] ?? props.model.id)
const architecture = computed(
  () => props.model.meta.architecture as { modality?: string; tokenizer?: string } | undefined
)
const pricing = computed(
  () => props.model.meta.pricing as { prompt: string; completion: string } | undefined
)
const topProvider = computed(
  () => props.model.meta.top_provider as { max_completion_tokens?: number } | undefined
)
const description = computed(() => props.model.meta.description as string | undefined)
</script>

<template>
  <div class="or-card">
    <div class="card-header">
      <h3 class="model-name">{{ model.name }}</h3>
      <Badge v-if="architecture?.modality" type="info">{{ architecture.modality }}</Badge>
    </div>

    <div class="card-meta">
      <span class="publisher">{{ publisher }}</span>
      <Badge v-if="architecture?.tokenizer" type="secondary">{{ architecture.tokenizer }}</Badge>
    </div>

    <div class="card-stats">
      <span class="stat">
        <span class="stat-label">Context</span>
        <span class="stat-value">{{ formatContext(model.contextLength) }}</span>
      </span>
      <span v-if="pricing" class="stat">
        <span class="stat-label">Prompt</span>
        <span class="stat-value">{{ formatPrice(pricing.prompt) }}</span>
      </span>
      <span v-if="pricing" class="stat">
        <span class="stat-label">Completion</span>
        <span class="stat-value">{{ formatPrice(pricing.completion) }}</span>
      </span>
      <span v-if="topProvider?.max_completion_tokens" class="stat">
        <span class="stat-label">Max out</span>
        <span class="stat-value">{{ formatContext(topProvider.max_completion_tokens) }}</span>
      </span>
    </div>

    <p v-if="description" class="description">{{ description }}</p>
  </div>
</template>

<style scoped lang="scss">
.or-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  font-size: var(--text-base);
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.publisher {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 0.5rem;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
}

.description {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
