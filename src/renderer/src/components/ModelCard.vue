<script setup lang="ts">
import { computed } from 'vue'
import type { Model } from '@shared/lm-studio/ipc-contracts'

const props = defineProps<{ model: Model }>()

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

const isLoaded = computed(() => props.model.loaded_instances.length > 0)
</script>

<template>
  <div class="model-card" :class="{ loaded: isLoaded }">
    <div class="card-header">
      <h3 class="model-name">{{ model.display_name }}</h3>
      <span class="status-badge" :class="isLoaded ? 'status-loaded' : 'status-idle'">
        {{ isLoaded ? 'Loaded' : 'Idle' }}
      </span>
    </div>

    <div class="card-meta">
      <span class="publisher">{{ model.publisher }}</span>
      <span class="badge">
        {{ model.type === 'llm' ? 'LLM' : 'Embedding' }}
      </span>
      <span v-if="model.format" class="badge">{{ model.format.toUpperCase() }}</span>
    </div>

    <div class="card-stats">
      <div v-if="model.params_string" class="stat">
        <span class="stat-label">Params</span>
        <span class="stat-value">{{ model.params_string }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Size</span>
        <span class="stat-value">{{ formatBytes(model.size_bytes) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Context</span>
        <span class="stat-value">{{ formatContext(model.max_context_length) }}</span>
      </div>
      <div v-if="model.architecture" class="stat">
        <span class="stat-label">Arch</span>
        <span class="stat-value">{{ model.architecture }}</span>
      </div>
      <div v-if="model.quantization?.name" class="stat">
        <span class="stat-label">Quant</span>
        <span class="stat-value">
          {{ model.quantization.name }}
          <span v-if="model.quantization.bits_per_weight" class="quant-bits">{{ model.quantization.bits_per_weight }}bpw</span>
        </span>
      </div>
    </div>

    <div v-if="model.capabilities" class="card-capabilities">
      <span class="cap-badge" :class="{ active: model.capabilities.vision }">Vision</span>
      <span class="cap-badge" :class="{ active: model.capabilities.trained_for_tool_use }">Tool use</span>
    </div>

    <div v-if="isLoaded" class="loaded-instances">
      <div
        v-for="instance in model.loaded_instances"
        :key="instance.id"
        class="instance"
      >
        <span class="instance-dot" />
        <span class="instance-label">Running · {{ formatContext(instance.config.context_length) }} ctx</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.model-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 4px 16px var(--shadow);
}

.model-card.loaded {
  border-color: var(--accent-border);
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

.status-badge {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  letter-spacing: 0.03em;
}

.status-loaded {
  background: var(--green-dim);
  color: var(--green);
}

.status-idle {
  background: var(--surface-elevated);
  color: var(--text-muted);
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

.format-badge {
  background: var(--surface-elevated);
  color: var(--text-muted);
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
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.quant-bits {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.card-capabilities {
  display: flex;
  gap: 6px;
}

.cap-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  color: var(--text-muted);
  background: transparent;
}

.cap-badge.active {
  border-color: var(--green-dim);
  background: var(--green-dim);
  color: var(--green);
}

.loaded-instances {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--border);
}

.instance {
  display: flex;
  align-items: center;
  gap: 8px;
}

.instance-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--green);
  flex-shrink: 0;
}

.instance-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
}
</style>
