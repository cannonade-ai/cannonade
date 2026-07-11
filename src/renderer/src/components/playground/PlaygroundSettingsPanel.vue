<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { IconLoader2 } from '@tabler/icons-vue'
import { Collapse, Field, NumberInput, Panel, ScrollArea, Select } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import PlaygroundSystemPrompt from './PlaygroundSystemPrompt.vue'
import { usePlaygroundStore } from '@renderer/stores/playground'

const playground = usePlaygroundStore()
const { modelId, models, modelsLoading, modelsError, params, chatProviders } =
  storeToRefs(playground)

const providerOptions = computed<SelectOption[]>(() =>
  chatProviders.value.map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const modelOptions = computed<SelectOption[]>(() =>
  models.value.filter((m) => m.type === 'llm').map((m) => ({ value: m.id, label: m.name }))
)

const selectedProvider = computed<string | undefined>({
  get: () => playground.providerId || undefined,
  set: (value) => {
    if (value) void playground.selectProvider(value)
  }
})

const reasoningOptions: SelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'off', label: 'Off' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'on', label: 'On' }
]

const reasoning = computed<string>({
  get: () => params.value.reasoning ?? 'default',
  set: (value) => {
    params.value.reasoning =
      value === 'default' ? undefined : (value as 'off' | 'low' | 'medium' | 'high' | 'on')
  }
})
</script>

<template>
  <Panel title="Settings" class="settings-panel">
    <ScrollArea>
      <div class="settings-content">
        <div class="field-row">
          <Field label="Provider" grow>
            <Select
              v-model="selectedProvider"
              :options="providerOptions"
              placeholder="Select provider"
            />
          </Field>
          <Field label="Model" grow>
            <div v-if="modelsLoading" class="model-loading">
              <IconLoader2 :size="14" class="spin" />
            </div>
            <Select
              v-else
              v-model="modelId"
              :options="modelOptions"
              :disabled="!!modelsError"
              placeholder="Select model"
            />
          </Field>
        </div>
        <p v-if="modelsError" class="models-error">{{ modelsError }}</p>

        <PlaygroundSystemPrompt />

        <Collapse label="Model Parameters">
          <Field
            label="Max Tokens"
            hint="The longest response the model may produce, measured in tokens. A token is roughly ¾ of a word."
          >
            <NumberInput v-model="params.max_output_tokens" :min="1" :max="999999999" />
          </Field>
          <div class="field-row">
            <Field
              label="Temperature"
              hint="Controls randomness. Higher values give more varied, creative answers; lower values are more focused and predictable."
              grow
            >
              <NumberInput v-model="params.temperature" :min="0" :max="1" :step="0.05" />
            </Field>
            <Field
              label="Top P"
              hint="Limits word choices to the most likely options that together reach this probability. Lower is more focused."
              grow
            >
              <NumberInput v-model="params.top_p" :min="0" :max="1" :step="0.05" />
            </Field>
          </div>
          <div class="field-row">
            <Field
              label="Top K"
              hint="Limits word choices to the K most likely options at each step."
              grow
            >
              <NumberInput v-model="params.top_k" :min="0" :max="999999999" :step="1" />
            </Field>
            <Field
              label="Min P"
              hint="Drops word choices that are far less likely than the best option. Higher is stricter."
              grow
            >
              <NumberInput v-model="params.min_p" :min="0" :max="1" :step="0.05" />
            </Field>
          </div>
          <div class="field-row">
            <Field
              label="Repeat Penalty"
              hint="Discourages repeating the same words. Higher values reduce repetition."
              grow
            >
              <NumberInput v-model="params.repeat_penalty" :min="1" :max="2" :step="0.05" />
            </Field>
            <Field
              label="Freq. Penalty"
              hint="Lowers the chance of words that have already appeared often in the response."
              grow
            >
              <NumberInput v-model="params.frequency_penalty" :min="-2" :max="2" :step="0.1" />
            </Field>
          </div>
          <div class="field-row">
            <Field
              label="Pres. Penalty"
              hint="Lowers the chance of words that have appeared at all, nudging the model toward new topics."
              grow
            >
              <NumberInput v-model="params.presence_penalty" :min="-2" :max="2" :step="0.1" />
            </Field>
            <Field
              label="Seed"
              hint="Fixes the randomness so the same input gives the same output. Leave empty for random results."
              grow
            >
              <NumberInput v-model="params.seed" :step="1" />
            </Field>
          </div>
          <Field
            label="Reasoning"
            hint="Requests a reasoning effort level from models that support it. Unsupported models ignore this."
          >
            <Select v-model="reasoning" :options="reasoningOptions" />
          </Field>
        </Collapse>
      </div>
    </ScrollArea>
  </Panel>
</template>

<style scoped lang="scss">
.settings-panel {
  :deep(.panel__body) {
    padding: 0;
  }
}

.settings-content {
  display: flex;
  flex-direction: column;

  > .field-row {
    padding: 14px;
  }
}

.field-row {
  display: flex;
  gap: 8px;
}

.model-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.875rem;
  color: var(--text-muted);
}

.models-error {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--error);
}
</style>
