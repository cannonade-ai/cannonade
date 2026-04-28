<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'
import BaseField from '@renderer/components/base/BaseField.vue'

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
      <div class="field-row">
        <base-field label="Temperature" grow>
          <input
            class="field-input"
            type="number"
            min="0"
            max="2"
            step="0.1"
            :value="config?.temperature ?? ''"
            @change="setNumber('temperature', ($event.target as HTMLInputElement).value)"
          />
        </base-field>
        <base-field label="Top P" grow>
          <input
            class="field-input"
            type="number"
            min="0"
            max="1"
            step="0.05"
            :value="config?.topP ?? ''"
            @change="setNumber('topP', ($event.target as HTMLInputElement).value)"
          />
        </base-field>
      </div>
      <base-field label="Max Tokens">
        <input
          class="field-input"
          type="number"
          min="1"
          :value="config?.maxTokens ?? ''"
          @change="setNumber('maxTokens', ($event.target as HTMLInputElement).value)"
        />
      </base-field>
      <div class="field-row">
        <base-field label="Freq. Penalty" grow>
          <input
            class="field-input"
            type="number"
            min="-2"
            max="2"
            step="0.1"
            :value="config?.frequencyPenalty ?? ''"
            @change="setNumber('frequencyPenalty', ($event.target as HTMLInputElement).value)"
          />
        </base-field>
        <base-field label="Pres. Penalty" grow>
          <input
            class="field-input"
            type="number"
            min="-2"
            max="2"
            step="0.1"
            :value="config?.presencePenalty ?? ''"
            @change="setNumber('presencePenalty', ($event.target as HTMLInputElement).value)"
          />
        </base-field>
      </div>
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

.field-row {
  display: flex;
  gap: 8px;
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
