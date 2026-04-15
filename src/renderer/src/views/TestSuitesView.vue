<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TestSuite, TestCase } from '@shared/app/test-suite'
import TestSuiteInfoPanel from '../components/test-suites/TestSuiteInfoPanel.vue'
import TestSuiteRunConfigPanel from '../components/test-suites/TestSuiteRunConfigPanel.vue'
import TestCaseList from '../components/test-suites/TestCaseList.vue'
import TestCaseEditor from '../components/test-suites/TestCaseEditor.vue'

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
</script>

<template>
  <div class="view">
    <div class="left-panel">
      <TestSuiteInfoPanel :suite="suite" />
      <TestSuiteRunConfigPanel :config="suite.defaultRunConfig" />
    </div>

    <div class="right-panel">
      <div class="case-list-area" :class="{ 'editor-visible': editorOpen }">
        <TestCaseList
          :cases="suite.testCases"
          :selected-id="selectedCaseId"
          @select-case="onSelectCase"
          @add-case="onAddCase"
        />
      </div>
      <div v-if="editorOpen" class="editor-area">
        <TestCaseEditor :test-case="selectedCase" :is-new="isNewCase" @close="onCloseEditor" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  height: 100%;
  gap: 12px;
  background: var(--bg);
}

.left-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.case-list-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.case-list-area.editor-visible {
  flex: 0 0 45%;
}

.editor-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
