<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'

defineProps<{
  config: RunConfig | undefined
}>()
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Default Run Config</span>
    </div>
    <div class="panel-body">
      <div v-if="!config" class="empty-config">
        <span>No run config set</span>
        <button class="btn-add-config">+ Add Config</button>
      </div>
      <template v-else>
        <div class="field">
          <label class="field-label">Provider</label>
          <select class="field-select" :value="config.provider">
            <option value="lmstudio">LM Studio</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Model</label>
          <input class="field-input" :value="config.model" />
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Temperature</label>
            <input
              class="field-input"
              type="number"
              min="0"
              max="2"
              step="0.1"
              :value="config.temperature ?? ''"
            />
          </div>
          <div class="field">
            <label class="field-label">Top P</label>
            <input
              class="field-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              :value="config.topP ?? ''"
            />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Max Tokens</label>
          <input class="field-input" type="number" min="1" :value="config.maxTokens ?? ''" />
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Freq. Penalty</label>
            <input
              class="field-input"
              type="number"
              min="-2"
              max="2"
              step="0.1"
              :value="config.frequencyPenalty ?? ''"
            />
          </div>
          <div class="field">
            <label class="field-label">Pres. Penalty</label>
            <input
              class="field-input"
              type="number"
              min="-2"
              max="2"
              step="0.1"
              :value="config.presencePenalty ?? ''"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.panel-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.empty-config {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.btn-add-config {
  font-size: 0.78rem;
  font-weight: 500;
  padding: 5px 12px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.btn-add-config:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.field-row {
  display: flex;
  gap: 8px;
}

.field-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.field-input,
.field-select {
  width: 100%;
  padding: 6px 8px;
  font-size: 0.82rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}

.field-input:focus,
.field-select:focus {
  border-color: var(--accent);
}

.field-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23767575' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 26px;
  cursor: pointer;
}
</style>
