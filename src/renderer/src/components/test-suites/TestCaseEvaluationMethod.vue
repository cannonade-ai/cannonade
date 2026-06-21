<script setup lang="ts">
import {
  Field,
  InfoTooltip,
  NumberInput,
  Select,
  Textarea,
  Button,
  Toggle
} from '@renderer/components/ui'
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

const TYPE_HINTS: Record<EvaluationConfig['type'], string> = {
  exact_match:
    'Passes only if the output matches the expected text exactly, character for character.',
  contains: 'Passes if the output contains the expected text. Accepts comma-separated values.',
  regex: 'Passes if the output matches the given regular expression pattern.',
  rouge: 'Scores how much the output overlaps with the expected text. Often used for summaries.',
  levenshtein: 'Scores how few character edits it takes to turn the output into the expected text.',
  f1: 'Balances how much of the expected text was found against how much extra was added.',
  json_match: 'Passes if the output is valid JSON that matches the expected structure.',
  bleu: 'Scores word overlap with the expected text. Commonly used for translations.',
  custom: 'Run your own JavaScript function to score the output however you like.',
  code_execution: 'Runs the output as code and checks whether it executes successfully.',
  cosine_similarity:
    'Compares the meaning of the output and expected text. Uses a small built-in LLM to create embeddings.'
}

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

const typeHint = computed(() => TYPE_HINTS[type.value])
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
        <InfoTooltip :content="typeHint" placement="left" />
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
      <Field
        v-if="showThreshold"
        label="Threshold (0 – 1)"
        hint="The minimum score the output must reach to pass. Higher values are stricter."
      >
        <NumberInput v-model="threshold" :min="0" :max="1" :step="0.05" placeholder="0.0 – 1.0" />
      </Field>
      <Field
        v-if="showNegate"
        label="Negate"
        hint="Makes the eval check for absence instead of presence of the expected value. 'contains' eval becomes 'not contains' if negate is enabled."
        inline
      >
        <Toggle v-model="negate" />
      </Field>
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
