<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'
import SectionHeader from '../components/SectionHeader.vue'
import TestSuiteList from '../components/test-suites/TestSuiteList.vue'
import TestSuiteDetail from '../components/test-suites/TestSuiteDetail.vue'

const mockSuites: TestSuite[] = [
  {
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
  },
  {
    id: 'suite-2',
    name: 'Code Assistant Benchmark',
    description: 'Tests code generation accuracy, correctness, and style compliance',
    version: '0.4.1',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-04-05T11:20:00Z',
    tags: ['coding', 'benchmark'],
    defaultRunConfig: {
      provider: 'openrouter',
      model: 'anthropic/claude-3-7-sonnet',
      temperature: 0.2,
      maxTokens: 4096
    },
    testCases: [
      {
        id: 'tc-5',
        name: 'FizzBuzz implementation',
        description: 'Generate a correct FizzBuzz in Python',
        input: {
          type: 'chat',
          messages: [
            { role: 'system', content: 'You are a coding assistant. Write clean Python code.' },
            { role: 'user', content: 'Implement FizzBuzz for 1 to 100.' }
          ]
        },
        evaluation: {
          type: 'code_execution',
          customValidator: { language: 'javascript', code: '' },
          codeExecution: { language: 'javascript', testCases: [] }
        }
      },
      {
        id: 'tc-6',
        name: 'Reverse a linked list',
        description: 'Returns iterative solution with correct logic',
        input: {
          type: 'chat',
          messages: [
            { role: 'system', content: 'You are a coding assistant.' },
            { role: 'user', content: 'Write a function to reverse a singly linked list in Python.' }
          ]
        },
        evaluation: {
          type: 'code_execution',
          customValidator: { language: 'javascript', code: '' },
          codeExecution: { language: 'javascript', testCases: [] }
        }
      }
    ]
  },
  {
    id: 'suite-3',
    name: 'Multilingual FAQ',
    description: 'Validates consistent answers in English, Spanish, and French',
    version: '1.0.0',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-03-22T16:45:00Z',
    tags: ['i18n', 'faq'],
    defaultRunConfig: {
      provider: 'lmstudio',
      model: 'mistral-7b-instruct',
      temperature: 0.5,
      maxTokens: 1024
    },
    testCases: [
      {
        id: 'tc-7',
        name: 'Return policy — EN',
        description: 'English return policy question',
        input: {
          type: 'chat',
          messages: [
            { role: 'system', content: 'You are a support agent. Returns accepted within 30 days.' },
            { role: 'user', content: 'What is your return policy?' }
          ]
        },
        evaluation: {
          type: 'regex',
          expected: '30.day',
          customValidator: { language: 'javascript', code: '' },
          codeExecution: { language: 'javascript', testCases: [] }
        }
      }
    ]
  }
]

const suites = ref<TestSuite[]>(mockSuites)
const selectedId = ref<string | null>(null)

const selectedSuite = computed<TestSuite | null>(
  () => suites.value.find((s) => s.id === selectedId.value) ?? null
)

function onSelectSuite(id: string): void {
  selectedId.value = id
}

function onBack(): void {
  selectedId.value = null
}

function onSave(updated: TestSuite): void {
  const idx = suites.value.findIndex((s) => s.id === updated.id)
  if (idx !== -1) suites.value[idx] = updated
}
</script>

<template>
  <div class="view">
    <template v-if="selectedSuite">
      <TestSuiteDetail
        :suite="selectedSuite"
        @back="onBack"
        @save="onSave"
      />
    </template>

    <template v-else>
      <section-header>
        <button class="btn-new">
          <icon-plus :size="14" :stroke-width="2.5" />
          New Suite
        </button>
      </section-header>

      <div class="list-panel">
        <div class="list-header">
          <span class="list-title">
            Test Suites
            <span class="count-pill">{{ suites.length }}</span>
          </span>
        </div>
        <TestSuiteList
          :suites="suites"
          :selected-id="selectedId"
          @select-suite="onSelectSuite"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.list-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.list-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 3rem;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.count-pill {
  font-size: 0.68rem;
  background: var(--surface-elevated);
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-new:hover {
  background: rgba(255, 179, 0, 0.3);
}
</style>
