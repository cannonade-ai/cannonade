<script setup lang="ts">
import { Field, NumberInput, Select, Textarea, Button, Toggle } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import type { EvaluationConfig } from '@shared/app/test-suite'
import { IconTrash } from '@tabler/icons-vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  evaluation: EvaluationConfig
  index: number
}>()

const emit = defineEmits<{
  update: [evaluation: EvaluationConfig]
  remove: []
}>()

const evaluationTypes: SelectOption<EvaluationConfig['type']>[] = [
  { value: 'exact_match', label: 'Exact Match' },
  { value: 'contains', label: 'Contains' },
  { value: 'regex', label: 'Regex' },
  { value: 'rouge', label: 'ROUGE' },
  { value: 'levenshtein', label: 'Levenshtein' },
  { value: 'f1', label: 'F1' },
  { value: 'json_match', label: 'JSON Match' },
  { value: 'bleu', label: 'BLEU' },
  { value: 'custom', label: 'Custom Validator' },
  { value: 'code_execution', label: 'Code Execution' },
  { value: 'cosine_similarity', label: 'Cosine Similarity' }
]

const THRESHOLD_TYPES: EvaluationConfig['type'][] = [
  'bleu',
  'rouge',
  'levenshtein',
  'f1',
  'custom',
  'cosine_similarity'
]

const NON_NEGATABLE_TYPES: EvaluationConfig['type'][] = ['custom', 'code_execution']

const CUSTOM_VALIDATOR_PLACEHOLDER = `(output) => {
  // output: full model output string
  // return score between 0.0 and 1.0
  return {
    score: output.length > 0 ? 1.0 : 0.0,
    details: 'Output is non-empty'
  }
}`

const type = ref<EvaluationConfig['type']>(props.evaluation.type)
const expected = ref(typeof props.evaluation.expected === 'string' ? props.evaluation.expected : '')
const threshold = ref(props.evaluation.threshold ?? 0.9)
const negate = ref(props.evaluation.negate ?? false)
const customCode = ref(props.evaluation.customValidator?.code ?? CUSTOM_VALIDATOR_PLACEHOLDER)

watch(
  () => props.evaluation,
  (e) => {
    type.value = e.type
    expected.value = typeof e.expected === 'string' ? e.expected : ''
    threshold.value = e.threshold ?? 0.9
    negate.value = e.negate ?? false
    customCode.value = e.customValidator?.code ?? CUSTOM_VALIDATOR_PLACEHOLDER
  }
)

const showThreshold = computed(() => THRESHOLD_TYPES.includes(type.value))
const showExpected = computed(() => type.value !== 'custom')
const showNegate = computed(() => !NON_NEGATABLE_TYPES.includes(type.value))
const expectedLabel = computed(() => (type.value === 'regex' ? 'Pattern' : 'Expected'))

watch([type, expected, threshold, negate, customCode], () => {
  emit('update', {
    ...props.evaluation,
    type: type.value,
    expected: showExpected.value ? expected.value || undefined : undefined,
    threshold: showThreshold.value ? threshold.value : undefined,
    negate: showNegate.value && negate.value ? true : undefined,
    customValidator:
      type.value === 'custom' ? { language: 'javascript', code: customCode.value } : undefined
  })
})
</script>

<template>
  <div class="eval-method">
    <span class="eval-method__index">{{ index + 1 }}</span>
    <div class="eval-method__body">
      <div class="eval-method__type-row">
        <Select v-model="type" :options="evaluationTypes" class="eval-method__select" />
        <Button type="icon" :icon="IconTrash" @click="emit('remove')" />
      </div>
      <Field v-if="showExpected" :label="expectedLabel">
        <Textarea
          v-model="expected"
          :rows="3"
          :placeholder="type === 'regex' ? 'e.g. ^[a-z,]+$' : 'Expected output...'"
        />
      </Field>
      <Field v-if="type === 'custom'" label="Validator Function (JavaScript)">
        <Textarea
          v-model="customCode"
          :rows="8"
          :placeholder="CUSTOM_VALIDATOR_PLACEHOLDER"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          class="eval-method__code"
        />
      </Field>
      <Field v-if="showThreshold" label="Threshold (0 – 1)">
        <NumberInput v-model="threshold" :min="0" :max="1" :step="0.05" placeholder="0.0 – 1.0" />
      </Field>
      <label v-if="showNegate" class="eval-method__negate">
        <span>Negate (invert pass/fail result)</span>
        <Toggle v-model="negate" />
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.eval-method {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding-top: 10px;

  &__index {
    position: absolute;
    top: -9px;
    left: 10px;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
    padding: 0 5px;
    line-height: 1.6;
  }

  &__body {
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__type-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__select {
    flex: 1;
    min-width: 0;
  }

  &__code {
    font-family: monospace;
    font-size: var(--text-xs);
  }

  &__negate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--text-sm);
    color: var(--text-muted);
    cursor: pointer;
  }

  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
    transition:
      color 0.12s,
      background 0.12s;

    &:hover {
      color: var(--text-danger);
      background: var(--surface-elevated);
    }
  }
}
</style>
