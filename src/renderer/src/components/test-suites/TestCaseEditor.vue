<script setup lang="ts">
import { Button, Field, Input, Panel, Select, SplitPane, Textarea } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { useConfirmStore } from '@renderer/stores/confirm'
import type { EvaluationConfig, TestCase } from '@shared/app/test-suite'
import { IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import { ref, watch } from 'vue'
import TestCaseEvaluationMethod from './TestCaseEvaluationMethod.vue'

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

const passingLogicOptions: SelectOption<'all' | 'any'>[] = [
  { value: 'all', label: 'All must pass (AND)' },
  { value: 'any', label: 'Any must pass (OR)' }
]

const name = ref('')
const description = ref('')
const systemPrompt = ref('')
const userInput = ref('')
const evaluations = ref<EvaluationConfig[]>([])
const passingLogic = ref<'all' | 'any'>('all')

function defaultEvaluation(): EvaluationConfig {
  return {
    type: 'exact_match',
    expected: undefined,
    threshold: undefined
  }
}

watch(
  () => props.testCase,
  (tc) => {
    if (tc) {
      name.value = tc.name
      description.value = tc.description ?? ''
      systemPrompt.value = tc.input.messages?.find((m) => m.role === 'system')?.content ?? ''
      userInput.value =
        tc.input.messages?.find((m) => m.role === 'user')?.content ?? tc.input.prompt ?? ''
      evaluations.value = tc.evaluations.length > 0 ? [...tc.evaluations] : [defaultEvaluation()]
      passingLogic.value = tc.passingLogic ?? 'all'
    } else {
      name.value = ''
      description.value = ''
      systemPrompt.value = ''
      userInput.value = ''
      evaluations.value = [defaultEvaluation()]
      passingLogic.value = 'all'
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
    evaluations: evaluations.value,
    passingLogic: passingLogic.value
  }

  emit('save', testCase)
}

const errors = ref({ name: false, userInput: false })

function addEvaluation(): void {
  evaluations.value.push(defaultEvaluation())
}

function removeEvaluation(index: number): void {
  if (evaluations.value.length <= 1) return
  evaluations.value.splice(index, 1)
}

function updateEvaluation(index: number, updated: EvaluationConfig): void {
  evaluations.value[index] = updated
}

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
      <Button type="icon" class="btn-close" @click="emit('close')">
        <IconX :size="14" :stroke-width="2.5" />
      </Button>
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
            <Field
              label="System Prompt"
              hint="Instructions that set the model's role and behavior before it sees the user input."
            >
              <Textarea
                v-model="systemPrompt"
                :rows="4"
                placeholder="System instructions for the model..."
              />
            </Field>
            <Field label="User Input" hint="The user message sent to the model for this test case.">
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
            <span class="section-title">
              Evaluation Methods
              <span class="eval-count">{{ evaluations.length }}</span>
            </span>
            <Button
              type="secondary"
              :icon="IconPlus"
              :icon-stroke-width="2.5"
              @click="addEvaluation"
            >
              New
            </Button>
          </div>
          <div class="section-body section-body-fill">
            <div class="eval-methods">
              <TestCaseEvaluationMethod
                v-for="(ev, i) in evaluations"
                :key="i"
                :evaluation="ev"
                :index="i"
                @update="updateEvaluation(i, $event)"
                @remove="removeEvaluation(i)"
              />
            </div>
            <div v-if="evaluations.length > 1" class="passing-logic">
              <span class="passing-logic__label">Passing logic:</span>
              <Select
                v-model="passingLogic"
                :options="passingLogicOptions"
                class="passing-logic__select"
              />
            </div>
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
    justify-content: flex-start;
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
  margin-left: auto;
}

.section {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);

  &-fill {
    flex: 1;
    border-bottom: none;
    overflow: hidden;
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px 6px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
    min-height: 3rem;
  }

  &-title {
    display: flex;
    align-items: center;
    gap: 6px;
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
      overflow-y: auto;
    }
  }
}

.eval-count {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-elevated);
  border-radius: var(--radius-full);
  padding: 1px 6px;
  text-transform: none;
  letter-spacing: 0;
}

.eval-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.passing-logic {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 4px;

  &__label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__select {
    flex: 1;
  }
}
</style>
