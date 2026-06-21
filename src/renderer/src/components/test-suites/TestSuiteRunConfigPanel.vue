<script setup lang="ts">
import type { RunConfig } from '@shared/app/test-suite'
import { Field, NumberInput, Panel } from '@renderer/components/ui'

const config = defineModel<RunConfig | undefined>('config')
</script>

<template>
  <Panel title="Default Run Config">
    <Field
      label="Max Tokens"
      hint="The longest response the model may produce, measured in tokens. A token is roughly ¾ of a word."
    >
      <NumberInput v-model="config!.maxTokens" :min="1" :max="999999999" />
    </Field>
    <div class="field-row">
      <Field
        label="Temperature"
        hint="Controls randomness. Higher values give more varied, creative answers; lower values are more focused and predictable."
        grow
      >
        <NumberInput v-model="config!.temperature" :min="0" :max="1" :step="0.05" />
      </Field>
      <Field
        label="Top P"
        hint="Limits word choices to the most likely options that together reach this probability. Lower is more focused."
        grow
      >
        <NumberInput v-model="config!.topP" :min="0" :max="1" :step="0.05" />
      </Field>
    </div>
    <div class="field-row">
      <Field
        label="Top K"
        hint="Limits word choices to the K most likely options at each step."
        grow
      >
        <NumberInput v-model="config!.topK" :min="0" :max="999999999" :step="1" />
      </Field>
      <Field
        label="Min P"
        hint="Drops word choices that are far less likely than the best option. Higher is stricter."
        grow
      >
        <NumberInput v-model="config!.minP" :min="0" :max="1" :step="0.05" />
      </Field>
    </div>
    <div class="field-row">
      <Field
        label="Repeat Penalty"
        hint="Discourages repeating the same words. Higher values reduce repetition."
        grow
      >
        <NumberInput v-model="config!.repeatPenalty" :min="1" :max="2" :step="0.05" />
      </Field>
      <Field
        label="Freq. Penalty"
        hint="Lowers the chance of words that have already appeared often in the response."
        grow
      >
        <NumberInput v-model="config!.frequencyPenalty" :min="-2" :max="2" :step="0.1" />
      </Field>
    </div>
    <div class="field-row">
      <Field
        label="Pres. Penalty"
        hint="Lowers the chance of words that have appeared at all, nudging the model toward new topics."
        grow
      >
        <NumberInput v-model="config!.presencePenalty" :min="-2" :max="2" :step="0.1" />
      </Field>
      <Field
        label="Seed"
        hint="Fixes the randomness so the same input gives the same output. Leave empty for random results."
        grow
      >
        <NumberInput v-model="config!.seed" :step="1" />
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
