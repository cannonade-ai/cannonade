<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'
import BaseSelect from '../BaseSelect.vue'
import type { SelectOption } from '../BaseSelect.vue'

const providerOptions: SelectOption<string>[] = [
  { value: 'lmstudio', label: 'LM Studio' },
  { value: 'openrouter', label: 'OpenRouter' }
]

const config = defineModel<RunConfig | undefined>('config')

function setNumber(key: keyof RunConfig, raw: string): void {
  if (!config.value) return
  const n = parseFloat(raw)
  ;(config.value as unknown as Record<string, unknown>)[key] = raw === '' ? undefined : n
}
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
          <base-select v-model="config.provider" :options="providerOptions" />
        </div>
        <div class="field">
          <label class="field-label">Model</label>
          <input v-model="config.model" class="field-input" />
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
              @change="setNumber('temperature', ($event.target as HTMLInputElement).value)"
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
              @change="setNumber('topP', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Max Tokens</label>
          <input
            class="field-input"
            type="number"
            min="1"
            :value="config.maxTokens ?? ''"
            @change="setNumber('maxTokens', ($event.target as HTMLInputElement).value)"
          />
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
              @change="setNumber('frequencyPenalty', ($event.target as HTMLInputElement).value)"
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
              @change="setNumber('presencePenalty', ($event.target as HTMLInputElement).value)"
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
  font-size: var(--text-xs);
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
}

.empty-config {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.btn-add-config {
  font-size: var(--text-xs);
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
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  box-shadow: none;
  transition: border-color 0.15s;
  -webkit-appearance: none;
  appearance: none;
}

.field-input:focus {
  border-color: var(--accent);
}
</style>
