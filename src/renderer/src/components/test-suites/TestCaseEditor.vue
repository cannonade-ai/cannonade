<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconX, IconTrash } from '@tabler/icons-vue'
import type { TestCase, EvaluationConfig } from '@shared/app/test-suite'
import BaseSelect from '@renderer/components/base/BaseSelect.vue'
import type { SelectOption } from '@renderer/components/base/BaseSelect.vue'
import BaseButton from '@renderer/components/base/BaseButton.vue'
import BaseModal from '@renderer/components/base/BaseModal.vue'
import BaseField from '@renderer/components/base/BaseField.vue'
import BasePanel from '@renderer/components/base/BasePanel.vue'

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

const showDeleteModal = ref(false)

function onConfirmDelete(): void {
  showDeleteModal.value = false
  emit('delete')
}
</script>

<template>
  <base-panel class="editor-panel" :title="isNew ? 'New Test Case' : 'Edit Test Case'">
    <template #header-right>
      <button class="btn-close" @click="emit('close')">
        <IconX :size="14" :stroke-width="2.5" />
      </button>
    </template>

    <template #footer>
      <base-button
        v-if="!isNew"
        type="danger-outline"
        :icon="IconTrash"
        @click="showDeleteModal = true"
      >
        Delete
      </base-button>
      <div class="footer-right">
        <base-button @click="emit('close')">Cancel</base-button>
        <base-button type="primary" @click="onSave">Save Test Case</base-button>
      </div>
    </template>

    <div class="editor-cols">
      <div class="left-col">
        <div class="section">
          <div class="section-header">
            <span class="section-title">General</span>
          </div>
          <div class="section-body">
            <base-field label="Name">
              <input
                v-model="name"
                class="field-input"
                :class="{ 'field-error': errors.name }"
                placeholder="Test case name"
                @input="errors.name = false"
              />
            </base-field>
            <base-field label="Description">
              <input v-model="description" class="field-input" placeholder="Optional description" />
            </base-field>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">Input</span>
          </div>
          <div class="section-body">
            <base-field label="System Prompt">
              <textarea
                v-model="systemPrompt"
                class="field-textarea"
                rows="4"
                placeholder="System instructions for the model..."
              />
            </base-field>
            <base-field label="User Input">
              <textarea
                v-model="userInput"
                class="field-textarea"
                :class="{ 'field-error': errors.userInput }"
                rows="4"
                placeholder="User message to send..."
                @input="errors.userInput = false"
              />
            </base-field>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="section section-fill">
          <div class="section-header">
            <span class="section-title">Evaluation</span>
          </div>
          <div class="section-body section-body-fill">
            <base-field label="Method">
              <base-select v-model="selectedEvalType" :options="evaluationTypes" />
            </base-field>
            <base-field label="Expected / Config" fill>
              <textarea
                v-model="evalExpected"
                class="field-textarea field-textarea-fill"
                :placeholder="
                  selectedEvalType === 'contains'
                    ? 'Comma-separated values, e.g. hello,world'
                    : 'Enter expected output or configuration...'
                "
              />
            </base-field>
          </div>
        </div>
      </div>
    </div>
  </base-panel>

  <base-modal v-model="showDeleteModal" title="Delete Test Case">
    Are you sure you want to delete this test case? This action cannot be undone.
    <template #actions="{ close }">
      <base-button @click="close">Cancel</base-button>
      <base-button type="danger" @click="onConfirmDelete">Delete</base-button>
    </template>
  </base-modal>
</template>

<style scoped>
.editor-panel :deep(.panel__body) {
  padding: 0;
  overflow: hidden;
}

.editor-panel :deep(.panel__footer) {
  justify-content: space-between;
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
}

.btn-close:hover {
  color: var(--text-primary);
  background: var(--surface-elevated);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-cols {
  display: flex;
  height: 100%;
  gap: 0;
}

.left-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
}

.section-fill {
  flex: 1;
  border-bottom: none;
}

.section-header {
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.section-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-body-fill {
  flex: 1;
  overflow: hidden;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--accent);
}

.field-error {
  border-color: var(--error);
}

.field-error:focus {
  border-color: var(--error);
}

.field-textarea {
  resize: vertical;
  line-height: 1.5;
}

.field-textarea-fill {
  flex: 1;
  resize: none;
  height: 100%;
}
</style>
