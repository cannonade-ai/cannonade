import { TestSuite } from '@shared/app/test-suite'

export const DEFAULT_SUITE: TestSuite = {
  id: 'sample-test-suite',
  name: 'Sample Test Suite',
  description: 'Example test suite with different cases and evals',
  version: '1.2.0',
  createdAt: '2026-05-05T19:34:12.462Z',
  updatedAt: '2026-05-05T19:34:12.462Z',
  defaultRunConfig: {},
  testCases: [
    {
      passingLogic: 'all',
      id: 'tc-1',
      name: 'planets',
      description: 'list planets',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Answer questions directly without any explanation.'
          },
          {
            role: 'user',
            content:
              "List the planets of our solar system in order from the Sun, separated by commas, all lowercase. Don't add any spaces to your response."
          }
        ]
      },
      evaluations: [
        {
          type: 'exact_match',
          expected: 'mercury,venus,earth,mars,jupiter,saturn,uranus,neptune'
        }
      ]
    },
    {
      passingLogic: 'all',
      id: 'tc-2',
      name: 'Reasoning 1',
      description: 'Reasonin detection',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Answer questions directly without any explanation.'
          },
          {
            role: 'user',
            content: 'A farmer has 17 sheep. All but 9 run away. How many are left?'
          }
        ]
      },
      evaluations: [
        {
          type: 'regex',
          expected: '.*9.*'
        },
        {
          type: 'not_contains',
          expected: '17,8'
        }
      ]
    },
    {
      passingLogic: 'all',
      id: 'tc-3',
      name: 'Reasoning 2',
      description: 'Reasonin detection',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. Answer questions directly without any explanation.'
          },
          {
            role: 'user',
            content: 'What is the capital of Australia?'
          }
        ]
      },
      evaluations: [
        {
          type: 'regex',
          expected: '.*(C|c)anberra.*'
        }
      ]
    },
    {
      id: 'tc-4',
      name: 'Math calculation',
      description: 'Simple command test with exact response type',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a calculator. You will receive a math problem. Execute the request and respond with the only with the answer of the question, do not explain anything'
          },
          {
            role: 'user',
            content: '10 * (9 - 4) + (5 - 7) * 20'
          }
        ]
      },
      evaluations: [
        {
          type: 'exact_match',
          expected: '10'
        }
      ],
      passingLogic: 'all'
    },
    {
      passingLogic: 'all',
      id: 'tc-5',
      name: 'Poem',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content: 'You are helpful assistant. answer without thinking'
          },
          {
            role: 'user',
            content: 'Write a poem about this 5 words: elephant, red, nucleoplasm, dream, warning'
          }
        ]
      },
      evaluations: [
        {
          type: 'contains',
          expected: 'elephant, red, nucleoplasm, dream, warning'
        },
        {
          type: 'regex',
          expected: '.*elephant.*'
        }
      ]
    },
    {
      passingLogic: 'all',
      id: 'tc-6',
      name: 'Custom test',
      description: 'this should not work ',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content: 'You are helpful assistant. answer without thinking'
          },
          {
            role: 'user',
            content: 'generate a random human name and surname'
          }
        ]
      },
      evaluations: [
        {
          type: 'custom',
          customValidator: {
            language: 'javascript',
            code: '(output) => {\n  const words = output.trim().split(/\\s+/)\n\n  // Must contain at least name + surname\n  if (words.length < 2) {\n    return {\n      score: 0.0,\n      details: \'Must contain at least 2 words\'\n    }\n  }\n\n  for (const word of words) {\n    // First letter must be uppercase\n    const firstLetter = word[0]\n    if (firstLetter !== firstLetter.toUpperCase()) {\n      return {\n        score: 0.0,\n        details: `Word "${word}" must start with uppercase`\n      }\n    }\n\n    // Remaining letters must be alphabetic lowercase\n    for (let i = 1; i < word.length; i++) {\n      const char = word[i]\n\n      const isLetter =\n        char.toLowerCase() !== char.toUpperCase()\n\n      const isLowercase =\n        char === char.toLowerCase()\n\n      if (!isLetter || !isLowercase) {\n        return {\n          score: 0.0,\n          details: `Invalid character in "${word}"`\n        }\n      }\n    }\n  }\n\n  return {\n    score: 1.0,\n    details: \'Valid full name\'\n  }\n}'
          },
          codeExecution: {
            language: 'javascript',
            testCases: []
          },
          threshold: 0.9
        }
      ]
    }
  ]
}
