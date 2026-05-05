<script setup lang="ts">
import { Field, NumberInput, Select, Textarea, Button } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import type { EvaluationConfig } from '@shared/app/test-suite'
import { IconX } from '@tabler/icons-vue'
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
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'regex', label: 'Regex' },
  { value: 'rouge', label: 'ROUGE' },
  { value: 'levenshtein', label: 'Levenshtein' },
  { value: 'f1', label: 'F1' },
  { value: 'json_match', label: 'JSON Match' },
  { value: 'bleu', label: 'BLEU' },
  { value: 'mrr', label: 'MRR' },
  { value: 'custom', label: 'Custom Validator' },
  { value: 'code_execution', label: 'Code Execution' }
]

const THRESHOLD_TYPES: EvaluationConfig['type'][] = ['bleu', 'rouge', 'levenshtein', 'f1', 'mrr']

const type = ref<EvaluationConfig['type']>(props.evaluation.type)
const expected = ref(typeof props.evaluation.expected === 'string' ? props.evaluation.expected : '')
const threshold = ref(props.evaluation.threshold ?? 0.9)

watch(
  () => props.evaluation,
  (e) => {
    type.value = e.type
    expected.value = typeof e.expected === 'string' ? e.expected : ''
    threshold.value = e.threshold ?? 0.9
  }
)

const showThreshold = computed(() => THRESHOLD_TYPES.includes(type.value))
const expectedLabel = computed(() => (type.value === 'regex' ? 'Pattern' : 'Expected'))

watch([type, expected, threshold], () => {
  emit('update', {
    ...props.evaluation,
    type: type.value,
    expected: expected.value || undefined,
    threshold: showThreshold.value ? threshold.value : undefined
  })
})
</script>

<template>
  <div class="eval-method">
    <span class="eval-method__index">{{ index + 1 }}</span>
    <div class="eval-method__body">
      <div class="eval-method__type-row">
        <Select v-model="type" :options="evaluationTypes" class="eval-method__select" />
        <Button type="icon" :icon="IconX" @click="emit('remove')" />
      </div>
      <Field :label="expectedLabel">
        <Textarea
          v-model="expected"
          :rows="3"
          :placeholder="type === 'regex' ? 'e.g. ^[a-z,]+$' : 'Expected output...'"
        />
      </Field>
      <Field v-if="showThreshold" label="Threshold (0 – 1)">
        <NumberInput v-model="threshold" :min="0" :max="1" :step="0.05" placeholder="0.0 – 1.0" />
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
