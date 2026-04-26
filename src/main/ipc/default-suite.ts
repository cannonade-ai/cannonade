import { TestSuite } from '@shared/app/test-suite'

export const DEFAULT_SUITE: TestSuite = {
  id: 'default-suite-1',
  name: 'Customer Support Eval',
  description: 'Evaluates response quality across common customer support scenarios',
  version: '1.2.0',
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-04-10T14:32:00Z',
  defaultRunConfig: {
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
