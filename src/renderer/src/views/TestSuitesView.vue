<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconDeviceFloppy } from '@tabler/icons-vue'
import type { TestSuite, TestCase } from '@shared/app/test-suite'
import TestSuiteInfoPanel from '../components/test-suites/TestSuiteInfoPanel.vue'
import TestSuiteRunConfigPanel from '../components/test-suites/TestSuiteRunConfigPanel.vue'
import TestCaseList from '../components/test-suites/TestCaseList.vue'
import TestCaseEditor from '../components/test-suites/TestCaseEditor.vue'
import SectionHeader from '../components/SectionHeader.vue'

const mockSuite: TestSuite = {
  id: 'suite-1',
  name: 'Customer Support Eval',
  description: 'Evaluates response quality across common customer support scenarios',
  version: '1.2.0',
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-04-10T14:32:00Z',
  tags: ['customer-support', 'quality', 'llm-eval'],
  defaultRunConfig: {
    provider: 'openrouter',
    model: 'anthropic/claude-3-5-sonnet',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0
  },
  testCases: [
    {
      id: 'tc-1',
      name: 'Polite refund response',
      description: 'Should acknowledge and offer help with refund',
      input: {
        type: 'chat',
        messages: [
          { role: 'system', content: 'You are a helpful and empathetic customer support agent.' },
          { role: 'user', content: 'I want a refund for my order #1234.' }
        ]
      },
      evaluation: {
        type: 'exact_match',
        expected: 'I understand you would like a refund for order #1234.',
        customValidator: { language: 'javascript', code: '' },
        codeExecution: { language: 'javascript', testCases: [] }
      }
    },
    {
      id: 'tc-2',
      name: 'Escalation detection',
      description: 'Detects when to escalate to a human agent',
      input: {
        type: 'chat',
        messages: [
          { role: 'system', content: 'You are a customer support agent.' },
          {
            role: 'user',
            content: 'This is absolutely unacceptable, I demand to speak to a manager now!'
          }
        ]
      },
      evaluation: {
        type: 'regex',
        expected: '(escalat|transfer|manager|specialist)',
        customValidator: { language: 'javascript', code: '' },
        codeExecution: { language: 'javascript', testCases: [] }
      }
    },
    {
      id: 'tc-3',
      name: 'FAQ — shipping policy',
      description: 'Correctly quotes the shipping policy',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content: 'You are a support agent. Shipping takes 3–5 business days.'
          },
          { role: 'user', content: 'How long does shipping take?' }
        ]
      },
      evaluation: {
        type: 'bleu',
        expected: 'Shipping typically takes 3 to 5 business days.',
        threshold: 0.7,
        customValidator: { language: 'javascript', code: '' },
        codeExecution: { language: 'javascript', testCases: [] }
      }
    },
    {
      id: 'tc-4',
      name: 'JSON structured response',
      description: 'Returns a properly structured JSON ticket',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'Reply with a JSON object: { "category": string, "priority": "low"|"medium"|"high" }'
          },
          { role: 'user', content: 'My laptop screen is cracked.' }
        ]
      },
      evaluation: {
        type: 'json_match',
        expected: { category: 'hardware', priority: 'high' },
        customValidator: { language: 'javascript', code: '' },
        codeExecution: { language: 'javascript', testCases: [] }
      }
    }
  ]
}

const suite = ref<TestSuite>(mockSuite)
const selectedCaseId = ref<string | null>(null)
const isNewCase = ref(false)

const selectedCase = computed<TestCase | null>(() => {
  if (isNewCase.value) return null
  return suite.value.testCases.find((tc) => tc.id === selectedCaseId.value) ?? null
})

const editorOpen = computed(() => selectedCaseId.value !== null || isNewCase.value)

function onSelectCase(id: string): void {
  isNewCase.value = false
  selectedCaseId.value = selectedCaseId.value === id ? null : id
}

function onAddCase(): void {
  selectedCaseId.value = null
  isNewCase.value = true
}

function onCloseEditor(): void {
  selectedCaseId.value = null
  isNewCase.value = false
}

function onSave(): void {
  // TODO: persist suite
  console.log('save called')
}
</script>

<template>
  <div class="view">
    <section-header>
      <button class="btn-save" @click="onSave">
        <icon-device-floppy :size="14" />
        Save
      </button>
    </section-header>

    <div class="panels" :class="{ 'editor-visible': editorOpen }">
      <TestSuiteInfoPanel :suite="suite" />
      <TestCaseList
        :cases="suite.testCases"
        :selected-id="selectedCaseId"
        @select-case="onSelectCase"
        @add-case="onAddCase"
      />
      <TestSuiteRunConfigPanel :config="suite.defaultRunConfig" />
      <div v-if="editorOpen" class="editor-area">
        <TestCaseEditor :test-case="selectedCase" :is-new="isNewCase" @close="onCloseEditor" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.panels {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  align-content: start;
}

.editor-visible {
  align-content: stretch;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.btn-save:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.editor-area {
  overflow: hidden;
  height: 100%;
}
</style>
