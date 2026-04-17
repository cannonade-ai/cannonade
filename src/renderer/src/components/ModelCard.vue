<script setup lang="ts">
import { computed } from 'vue'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import { formatBytes, formatContext } from '../utils/format'

const props = defineProps<{ model: Model }>()

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
      <span v-if="model.params_string" class="stat">
        <span class="stat-label">Params</span>
        <span class="stat-value">{{ model.params_string }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Size</span>
        <span class="stat-value">{{ formatBytes(model.size_bytes) }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Ctx</span>
        <span class="stat-value">{{ formatContext(model.max_context_length) }}</span>
      </span>
      <span v-if="model.architecture" class="stat">
        <span class="stat-label">Arch</span>
        <span class="stat-value">{{ model.architecture }}</span>
      </span>
      <span v-if="model.quantization?.name" class="stat">
        <span class="stat-label">Quant</span>
        <span class="stat-value">{{ model.quantization.name }}</span>
      </span>
    </div>

    <div v-if="model.capabilities" class="card-capabilities">
      <span class="cap-badge" :class="{ active: model.capabilities.vision }">Vision</span>
      <span class="cap-badge" :class="{ active: model.capabilities.trained_for_tool_use }">
        Tool use
      </span>

      <div v-if="isLoaded" class="loaded-instances">
        <div v-for="instance in model.loaded_instances" :key="instance.id" class="instance">
          <span class="instance-dot" />
          <span class="instance-label">
            {{ formatContext(instance.config.context_length) }} ctx
          </span>
        </div>
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
  gap: 6px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
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
  font-size: var(--text-base);
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.status-badge {
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 3px 9px;
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
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 1px 6px;
  letter-spacing: 0.04em;
  background: var(--accent-dim);
  color: var(--accent);
}

.format-badge {
  background: var(--surface-elevated);
  color: var(--text-muted);
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

.quant-bits {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.card-capabilities {
  margin-top: 0.5rem;
  display: flex;
  gap: 6px;
}

.cap-badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
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
  flex-grow: 1;
  align-items: end;
  gap: 4px;
  padding-top: 4px;
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
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
</style>
