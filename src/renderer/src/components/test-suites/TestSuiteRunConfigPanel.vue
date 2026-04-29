<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'
import { Field, Panel } from '@renderer/components/ui'

const config = defineModel<RunConfig | undefined>('config')

function setNumber(key: keyof RunConfig, raw: string): void {
  if (!config.value) return
  const n = parseFloat(raw)
  ;(config.value as unknown as Record<string, unknown>)[key] = raw === '' ? undefined : n
}
</script>

<template>
  <Panel title="Default Run Config">
    <div class="field-row">
      <Field label="Temperature" grow>
        <input
          class="field-input"
          type="number"
          min="0"
          max="2"
          step="0.1"
          :value="config?.temperature ?? ''"
          @change="setNumber('temperature', ($event.target as HTMLInputElement).value)"
        />
      </Field>
      <Field label="Top P" grow>
        <input
          class="field-input"
          type="number"
          min="0"
          max="1"
          step="0.05"
          :value="config?.topP ?? ''"
          @change="setNumber('topP', ($event.target as HTMLInputElement).value)"
        />
      </Field>
    </div>
    <Field label="Max Tokens">
      <input
        class="field-input"
        type="number"
        min="1"
        :value="config?.maxTokens ?? ''"
        @change="setNumber('maxTokens', ($event.target as HTMLInputElement).value)"
      />
    </Field>
    <div class="field-row">
      <Field label="Freq. Penalty" grow>
        <input
          class="field-input"
          type="number"
          min="-2"
          max="2"
          step="0.1"
          :value="config?.frequencyPenalty ?? ''"
          @change="setNumber('frequencyPenalty', ($event.target as HTMLInputElement).value)"
        />
      </Field>
      <Field label="Pres. Penalty" grow>
        <input
          class="field-input"
          type="number"
          min="-2"
          max="2"
          step="0.1"
          :value="config?.presencePenalty ?? ''"
          @change="setNumber('presencePenalty', ($event.target as HTMLInputElement).value)"
        />
      </Field>
    </div>
  </Panel>
</template>

<style scoped>
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
