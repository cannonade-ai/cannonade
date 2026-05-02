<script setup lang="ts">
import { Button, Field, Input, Panel, Select, SplitPane, Textarea } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { useConfirmStore } from '@renderer/stores/confirm'
import type { EvaluationConfig, TestCase } from '@shared/app/test-suite'
import { IconTrash, IconX } from '@tabler/icons-vue'
import { ref, watch } from 'vue'

const confirmStore = useConfirmStore()

const props = defineProps<{
  testCase: TestCase | null
  isNew: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [testCase: TestCase]
  delete: []
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
  { value: 'mrr', label: 'MRR' },
  { value: 'custom', label: 'Custom Validator' },
  { value: 'code_execution', label: 'Code Execution' }
]

const name = ref('')
const description = ref('')
const systemPrompt = ref('')
const userInput = ref('')
const selectedEvalType = ref<EvaluationConfig['type']>('exact_match')
const evalExpected = ref('')

watch(
  () => props.testCase,
  (tc) => {
    if (tc) {
      name.value = tc.name
      description.value = tc.description ?? ''
      systemPrompt.value = tc.input.messages?.find((m) => m.role === 'system')?.content ?? ''
      userInput.value =
        tc.input.messages?.find((m) => m.role === 'user')?.content ?? tc.input.prompt ?? ''
      selectedEvalType.value = tc.evaluation.type
      evalExpected.value = typeof tc.evaluation.expected === 'string' ? tc.evaluation.expected : ''
    } else {
      name.value = ''
      description.value = ''
      systemPrompt.value = ''
      userInput.value = ''
      selectedEvalType.value = 'exact_match'
      evalExpected.value = ''
    }
  },
  { immediate: true }
)

function onSave(): void {
  errors.value.name = !name.value.trim()
  errors.value.userInput = !userInput.value.trim()
  if (errors.value.name || errors.value.userInput) return

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
  if (systemPrompt.value) messages.push({ role: 'system' as const, content: systemPrompt.value })
  messages.push({ role: 'user' as const, content: userInput.value })

  const testCase: TestCase = {
    id: props.testCase?.id ?? crypto.randomUUID(),
    name: name.value,
    description: description.value || undefined,
    input: { type: 'chat', messages },
    evaluation: {
      type: selectedEvalType.value,
      expected: evalExpected.value || undefined,
      customValidator: props.testCase?.evaluation.customValidator ?? {
        language: 'javascript',
        code: ''
      },
      codeExecution: props.testCase?.evaluation.codeExecution ?? {
        language: 'javascript',
        testCases: []
      }
    }
  }

  emit('save', testCase)
}

const errors = ref({ name: false, userInput: false })

async function onDelete(): Promise<void> {
  const confirmed = await confirmStore.confirm({
    title: 'Delete Test Case',
    message: 'Are you sure you want to delete this test case? This action cannot be undone.',
    confirmText: 'Delete',
    danger: true
  })
  if (confirmed) emit('delete')
}
</script>

<template>
  <Panel class="editor-panel" :title="isNew ? 'New Test Case' : 'Edit Test Case'">
    <template #header-right>
      <button class="btn-close" @click="emit('close')">
        <IconX :size="14" :stroke-width="2.5" />
      </button>
    </template>

    <template #footer>
      <Button v-if="!isNew" type="danger-outline" :icon="IconTrash" @click="onDelete">
        Delete
      </Button>
      <div class="footer-right">
        <Button @click="emit('close')">Cancel</Button>
        <Button type="primary" @click="onSave">Save Test Case</Button>
      </div>
    </template>

    <SplitPane>
      <template #start>
        <div class="section">
          <div class="section-header">
            <span class="section-title">General</span>
          </div>
          <div class="section-body">
            <Field label="Name">
              <Input
                v-model="name"
                :error="errors.name"
                placeholder="Test case name"
                @input="errors.name = false"
              />
            </Field>
            <Field label="Description">
              <Input v-model="description" placeholder="Optional description" />
            </Field>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">Input</span>
          </div>
          <div class="section-body">
            <Field label="System Prompt">
              <Textarea
                v-model="systemPrompt"
                :rows="4"
                placeholder="System instructions for the model..."
              />
            </Field>
            <Field label="User Input">
              <Textarea
                v-model="userInput"
                :error="errors.userInput"
                :rows="4"
                placeholder="User message to send..."
                @input="errors.userInput = false"
              />
            </Field>
          </div>
        </div>
      </template>

      <template #end>
        <div class="section section-fill">
          <div class="section-header">
            <span class="section-title">Evaluation</span>
          </div>
          <div class="section-body section-body-fill">
            <Field label="Method">
              <Select v-model="selectedEvalType" :options="evaluationTypes" />
            </Field>
            <Field label="Expected / Config" fill>
              <Textarea
                v-model="evalExpected"
                fill
                :placeholder="
                  selectedEvalType === 'contains'
                    ? 'Comma-separated values, e.g. hello,world'
                    : 'Enter expected output or configuration...'
                "
              />
            </Field>
          </div>
        </div>
      </template>
    </SplitPane>
  </Panel>
</template>

<style scoped lang="scss">
.editor-panel {
  :deep(.panel__body) {
    padding: 0;
    overflow: hidden;
  }

  :deep(.panel__footer) {
    justify-content: space-between;
  }
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: var(--text-primary);
    background: var(--surface-elevated);
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);

  &-fill {
    flex: 1;
    border-bottom: none;
  }

  &-header {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  &-title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
  }

  &-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &-fill {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
