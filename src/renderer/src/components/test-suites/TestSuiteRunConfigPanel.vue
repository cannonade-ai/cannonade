<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'
import { Field, NumberInput, Panel } from '@renderer/components/ui'

const config = defineModel<RunConfig | undefined>('config')
</script>

<template>
  <Panel title="Default Run Config">
    <div class="field-row">
      <Field label="Temperature" grow>
        <NumberInput v-model="config!.temperature" :min="0" :max="2" :step="0.1" />
      </Field>
      <Field label="Top P" grow>
        <NumberInput v-model="config!.topP" :min="0" :max="1" :step="0.05" />
      </Field>
    </div>
    <Field label="Max Tokens">
      <NumberInput v-model="config!.maxTokens" :min="1" :max="999999999999" />
    </Field>
    <div class="field-row">
      <Field label="Freq. Penalty" grow>
        <NumberInput v-model="config!.frequencyPenalty" :min="-2" :max="2" :step="0.1" />
      </Field>
      <Field label="Pres. Penalty" grow>
        <NumberInput v-model="config!.presencePenalty" :min="-2" :max="2" :step="0.1" />
      </Field>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.field-row {
  display: flex;
  gap: 8px;
}
</style>
