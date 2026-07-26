import { TestSuite } from '@shared/app/test-suite'

export const DEFAULT_SUITE: TestSuite = {
  id: 'default-tests',
  name: 'Default Tests',
  version: '2.0.1',
  description: 'Easy tests for small language models',
  createdAt: '2026-04-18T09:41:59.077Z',
  updatedAt: '2026-06-27T14:25:13.012Z',
  defaultRunConfig: {
    maxTokens: 2000
  },
  testCases: [
    {
      id: 'test-case-1',
      name: 'Planets',
      description: 'List planets',
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
              'List the planets of our solar system in order from the Sun, separated by commas, all lowercase. DO NOT ADD ANY spaces to your response.'
          }
        ]
      },
      evaluations: [
        {
          type: 'exact_match',
          expected: 'mercury,venus,earth,mars,jupiter,saturn,uranus,neptune'
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-2',
      name: 'Reasoning Trap',
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
          type: 'contains',
          expected: '17,8',
          negate: true
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-3',
      name: 'Reasoning',
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
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-4',
      name: 'Math calculation',
      description: 'Simple command test with exact response type',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a calculator. You will receive a math problem. Execute the request and respond with the only with the answer of the question, do not explain anything.'
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
      id: 'test-case-5',
      name: 'Poem',
      description: 'Writing poem with given words',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a poet. Write a short poem of 4 to 6 lines.\nYou MUST include all of the input words, each at least once, spelled exactly. The words will be provided in user input.\nUse every word naturally within the poem. Do not list the words, label them, or add any text outside the poem.\nDo not format your answer, respond with plain text.\n'
          },
          {
            role: 'user',
            content: 'ocean, silver, whisper, drift, moon'
          }
        ]
      },
      evaluations: [
        {
          type: 'contains',
          expected: 'ocean, silver, whisper, drift, moon'
        },
        {
          type: 'regex',
          expected: '.*ocean.*'
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-6',
      name: 'Name Generator',
      description: 'Test with a custom validator',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a command runner. Answer without thinking. Do not explain your answer or wrap it with any formatting. Do not answer in conversational form. execute the command you have been given and respond with only output.'
          },
          {
            role: 'user',
            content:
              'generate a random name and surname, respond with name and surname only. basic name and surname without middle name. just two words'
          }
        ]
      },
      evaluations: [
        {
          type: 'custom',
          customValidator: {
            language: 'javascript',
            code: '(output) => {\n  const words = output.trim().split(/\\s+/)\n\n  if (words.length < 2) {\n    return {\n      score: 0.0,\n      details: \'Must contain at least 2 words\'\n    }\n  }\n\n  for (const word of words) {\n    const firstLetter = word[0]\n    if (firstLetter !== firstLetter.toUpperCase()) {\n      return {\n        score: 0.0,\n        details: `Word "${word}" must start with uppercase`\n      }\n    }\n\n    // Remaining letters must be alphabetic lowercase\n    for (let i = 1; i < word.length; i++) {\n      const char = word[i]\n\n      const isLetter =\n        char.toLowerCase() !== char.toUpperCase()\n\n      const isLowercase =\n        char === char.toLowerCase()\n\n      if (!isLetter || !isLowercase) {\n        return {\n          score: 0.0,\n          details: `Invalid character in "${word}"`\n        }\n      }\n    }\n  }\n\n  return {\n    score: 1.0,\n    details: \'Valid full name\'\n  }\n}'
          },
          threshold: 0.9
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-7',
      name: 'Semantic',
      description: 'Semantic check with cosine similarity',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              "You are a customer support assistant for an online store. Follow these rules strictly:\n\n1. Answer only using the company's official policies. Do not invent details, dates, or exceptions.\n2. Be concise: respond in 1–3 sentences. Do not greet, apologize repeatedly, or add filler.\n3. Always state the concrete policy outcome first (yes/no and the condition), then any next step.\n4. Refund policy: full refunds are available within 30 days of purchase for unused items in original condition. After 30 days, no refunds are offered.\n5. Maintain a polite, professional, and neutral tone. Never make promises beyond the stated policy.\n\nExamples:\n\nUser: Do you offer free shipping?\nAssistant: Yes, orders over $50 ship free; orders under $50 have a flat $5 shipping fee.\n\nUser: My order arrived damaged, what do I do?\nAssistant: You're eligible for a free replacement or full refund on damaged items. Please send a photo of the damage to support@store.com to start the process.\n\nUser: Can I change the address after ordering?\nAssistant: Address changes are only possible before the order ships. Contact us immediately with your order number so we can check the status.\n"
          },
          {
            role: 'user',
            content: "Can I get my money back if I'm not happy with the product?"
          }
        ]
      },
      evaluations: [
        {
          type: 'cosine_similarity',
          expected:
            'Yes, you can get a full refund within 30 days of purchase, as long as the item is unused and in its original condition. After 30 days, refunds are not available.',
          threshold: 0.75
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-8',
      name: 'Summarize Photosynthesis',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              "You are a summarization assistant. Read the user's paragraph and respond with a single concise sentence that captures the main point. Respond with plain text only, no preamble or formatting."
          },
          {
            role: 'user',
            content:
              'Photosynthesis is the process plants use to make their own food. It takes place mainly in the leaves, inside structures called chloroplasts. Plants absorb sunlight, water from the soil, and carbon dioxide from the air. Using the energy from sunlight, they convert these ingredients into glucose and oxygen. The glucose feeds the plant, and the oxygen is released into the atmosphere.'
          }
        ]
      },
      evaluations: [
        {
          type: 'rouge',
          expected:
            'Plants use sunlight, water, and carbon dioxide to produce glucose for food and release oxygen.',
          threshold: 0.3
        }
      ],
      passingLogic: 'all'
    },
    {
      id: 'test-case-9',
      name: 'French Translation',
      description: 'Translate given text to French',
      input: {
        type: 'chat',
        messages: [
          {
            role: 'system',
            content:
              "You are a translation engine. Translate the user's text into French. Respond with only the translation, no quotes, notes, or explanation."
          },
          {
            role: 'user',
            content: 'I would like to buy a hamburger.'
          }
        ]
      },
      evaluations: [
        {
          type: 'bleu',
          expected: 'Je voudrais acheter un hamburger.',
          threshold: 0.3
        }
      ],
      passingLogic: 'all'
    }
  ]
}
