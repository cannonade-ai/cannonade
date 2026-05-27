import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeTestRun, type RunnerCallbacks } from './test-runner'
import type { TestRun, PerModelRun } from '@shared/app/test-run'
import type { TestSuite, TestCase, EvaluationConfig } from '@shared/app/test-suite'
import type { ChatResponse } from '@shared/lm-studio/chat'

vi.mock('../api', () => ({
  api: {
    getCapabilities: vi.fn(),
    chat: vi.fn(),
    downloadModel: vi.fn(),
    getDownloadStatus: vi.fn(),
    deleteModelByHfId: vi.fn(),
    unloadModel: vi.fn(),
    fetchLocalModels: vi.fn()
  }
}))

vi.mock('./evaluator', () => ({
  evaluateAll: vi.fn()
}))

import { api } from '../api'
import { evaluateAll } from './evaluator'

const mockApi = vi.mocked(api)
const mockEvaluate = vi.mocked(evaluateAll)

const lmStudioCapabilities = {
  chat: true,
  localModels: true,
  externalModels: false,
  downloadModel: true,
  downloadStatus: true,
  deleteModel: true,
  loadModel: true,
  serverControl: true,
  requiresApiKey: false
}

function makeCallbacks(): RunnerCallbacks {
  return {
    onRunStart: vi.fn(),
    onModelDownloading: vi.fn(),
    onModelRunStart: vi.fn(),
    onCaseStart: vi.fn(),
    onCaseComplete: vi.fn(),
    onModelRunComplete: vi.fn(),
    onRunComplete: vi.fn()
  }
}

const baseEval: EvaluationConfig = {
  type: 'exact_match'
}

function makeTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 'tc-1',
    name: 'Test Case 1',
    input: { type: 'completion', prompt: 'Say hello' },
    evaluations: [baseEval],
    passingLogic: 'any',
    ...overrides
  }
}

function makeModelRun(overrides: Partial<PerModelRun> = {}): PerModelRun {
  return {
    id: 'mr-1',
    modelRef: { source: 'installed', modelKey: 'llama-3' },
    status: 'pending',
    autoDownloaded: false,
    caseRuns: [],
    ...overrides
  }
}

function makeRun(modelRuns: PerModelRun[] = [makeModelRun()]): TestRun {
  return {
    id: 'run-1',
    suiteId: 'suite-1',
    suiteName: 'Suite 1',
    config: { suiteId: 'suite-1', provider: 'lmstudio', providerName: 'LM Studio', models: [] },
    status: 'pending',
    createdAt: new Date().toISOString(),
    modelRuns
  }
}

function makeSuite(testCases: TestCase[] = [makeTestCase()]): TestSuite {
  return {
    id: 'suite-1',
    name: 'Suite 1',
    version: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testCases
  }
}

function makeChatResponse(content: string, tps = 50, ttft = 0.1): ChatResponse {
  return {
    model_instance_id: 'model-1',
    output: [{ type: 'message', content }],
    stats: {
      input_tokens: 10,
      total_output_tokens: 20,
      reasoning_output_tokens: 0,
      tokens_per_second: tps,
      time_to_first_token_seconds: ttft
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
  mockApi.chat.mockResolvedValue(makeChatResponse('hello'))
  mockApi.getCapabilities.mockResolvedValue(lmStudioCapabilities)
  mockApi.downloadModel.mockResolvedValue({ job_id: '', status: 'already_downloaded' })
  mockApi.fetchLocalModels.mockResolvedValue([])
})

describe('executeTestRun – callback sequence', () => {
  it('calls onRunStart with the run id', async () => {
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    expect(callbacks.onRunStart).toHaveBeenCalledWith('run-1')
  })

  it('calls onModelRunStart for each model run', async () => {
    const modelRuns = [makeModelRun({ id: 'mr-1' }), makeModelRun({ id: 'mr-2' })]
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(modelRuns), makeSuite(), callbacks)
    expect(callbacks.onModelRunStart).toHaveBeenCalledWith('mr-1', false)
    expect(callbacks.onModelRunStart).toHaveBeenCalledWith('mr-2', false)
    expect(callbacks.onModelRunStart).toHaveBeenCalledTimes(2)
  })

  it('calls onCaseComplete once per test case per model run', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(testCases), callbacks)
    expect(callbacks.onCaseComplete).toHaveBeenCalledTimes(2)
  })

  it('calls onModelRunComplete after each model run completes', async () => {
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-1',
      'completed',
      expect.any(Object),
      undefined
    )
  })
})

describe('executeTestRun – model key resolution', () => {
  it('uses modelKey for installed model refs', async () => {
    const modelRun = makeModelRun({ modelRef: { source: 'installed', modelKey: 'llama-3-8b' } })
    await executeTestRun(makeRun([modelRun]), makeSuite(), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      'llama-3-8b',
      expect.objectContaining({ model: 'llama-3-8b' })
    )
  })

  it('uses modelId for huggingface model refs', async () => {
    mockApi.fetchLocalModels.mockResolvedValue([
      {
        id: 'meta/llama-3',
        name: 'llama-3',
        providerId: 'lmstudio',
        sizeBytes: 0,
        type: 'llm',
        loadedInstances: [],
        meta: {}
      }
    ])
    const modelRun = makeModelRun({ modelRef: { source: 'huggingface', modelId: 'meta/llama-3' } })
    await executeTestRun(makeRun([modelRun]), makeSuite(), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      'meta/llama-3',
      expect.objectContaining({ model: 'meta/llama-3' })
    )
  })
})

describe('executeTestRun – request building', () => {
  it('builds a completion request from prompt input', async () => {
    const testCase = makeTestCase({ input: { type: 'completion', prompt: 'Say hello' } })
    await executeTestRun(makeRun(), makeSuite([testCase]), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      expect.any(String),
      expect.objectContaining({ input: 'Say hello' })
    )
  })

  it('builds a chat request joining non-system messages', async () => {
    const testCase = makeTestCase({
      input: {
        type: 'chat',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' }
        ]
      }
    })
    await executeTestRun(makeRun(), makeSuite([testCase]), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      expect.any(String),
      expect.objectContaining({ input: 'Hello\nHi\nHow are you?' })
    )
  })

  it('extracts system message as system_prompt in chat request', async () => {
    const testCase = makeTestCase({
      input: {
        type: 'chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ]
      }
    })
    await executeTestRun(makeRun(), makeSuite([testCase]), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      expect.any(String),
      expect.objectContaining({
        system_prompt: 'You are a helpful assistant.',
        input: 'Hello'
      })
    )
  })

  it('passes runConfig params to the request', async () => {
    const testCase = makeTestCase({
      runConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 256
      }
    })
    await executeTestRun(makeRun(), makeSuite([testCase]), makeCallbacks())
    expect(mockApi.chat).toHaveBeenCalledWith(
      'lmstudio',
      expect.any(String),
      expect.objectContaining({ temperature: 0.7, top_p: 0.9, max_output_tokens: 256 })
    )
  })
})

describe('executeTestRun – output extraction', () => {
  it('passes extracted message content to evaluate', async () => {
    mockApi.chat.mockResolvedValue(makeChatResponse('extracted output'))
    await executeTestRun(makeRun(), makeSuite(), makeCallbacks())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'extracted output',
      expect.objectContaining({ id: 'tc-1' })
    )
  })

  it('ignores non-message output items', async () => {
    mockApi.chat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'reasoning', content: 'thinking...' },
        { type: 'message', content: 'final answer' }
      ]
    })
    await executeTestRun(makeRun(), makeSuite(), makeCallbacks())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'final answer',
      expect.objectContaining({ id: 'tc-1' })
    )
  })

  it('joins multiple message outputs with newline', async () => {
    mockApi.chat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'message', content: 'part one' },
        { type: 'message', content: 'part two' }
      ]
    })
    await executeTestRun(makeRun(), makeSuite(), makeCallbacks())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'part one\npart two',
      expect.objectContaining({ id: 'tc-1' })
    )
  })
})

describe('executeTestRun – case result construction', () => {
  it('maps response stats to result metrics', async () => {
    mockApi.chat.mockResolvedValue(makeChatResponse('hello', 100, 0.2))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    expect(callbacks.onCaseComplete).toHaveBeenCalledWith(
      'mr-1',
      'tc-1',
      expect.objectContaining({
        metrics: {
          tokensPerSecond: 100,
          timeToFirstTokenMs: 200,
          score: 1
        }
      }),
      expect.objectContaining({
        avgScore: 1,
        avgTokensPerSecond: 100,
        avgTimeToFirstTokenMs: 200
      })
    )
  })

  it('includes evaluation error in result', async () => {
    mockEvaluate.mockResolvedValue({
      passed: false,
      score: 0,
      evalResults: [],
      error: 'no match'
    })
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    expect(callbacks.onCaseComplete).toHaveBeenCalledWith(
      'mr-1',
      'tc-1',
      expect.objectContaining({
        passed: false,
        error: 'no match'
      }),
      expect.objectContaining({
        avgScore: 0,
        avgTokensPerSecond: 50,
        avgTimeToFirstTokenMs: 100
      })
    )
  })
})

describe('executeTestRun – error handling', () => {
  it('records per-case API error and continues to next case', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    mockApi.chat
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(makeChatResponse('ok'))
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(testCases), callbacks)
    expect(callbacks.onCaseComplete).toHaveBeenCalledTimes(2)
    expect(callbacks.onCaseComplete).toHaveBeenNthCalledWith(
      1,
      'mr-1',
      'tc-1',
      expect.objectContaining({
        testCaseId: 'tc-1',
        passed: false,
        error: 'network error',
        output: '',
        metrics: {}
      }),
      expect.objectContaining({
        avgScore: 0,
        failed: 1,
        passed: 0
      })
    )
  })

  it('marks model run as failed on fatal error from buildRequest', async () => {
    const badTestCase = { ...makeTestCase(), input: null as unknown as TestCase['input'] }
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite([badTestCase]), callbacks)
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-1',
      'failed',
      expect.any(Object),
      expect.any(String)
    )
  })

  it('marks overall run as failed when any model run encounters a fatal error', async () => {
    const badTestCase = { ...makeTestCase(), input: null as unknown as TestCase['input'] }
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite([badTestCase]), callbacks)
    expect(callbacks.onRunComplete).toHaveBeenCalledWith('run-1', 'failed')
  })

  it('marks overall run as completed when all model runs succeed', async () => {
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    expect(callbacks.onRunComplete).toHaveBeenCalledWith('run-1', 'completed')
  })
})

describe('executeTestRun – aggregate metrics', () => {
  it('computes correct aggregate for all passing results', async () => {
    mockApi.chat.mockResolvedValue(makeChatResponse('ok', 60, 0.1))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const callbacks = makeCallbacks()
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    await executeTestRun(makeRun(), makeSuite(testCases), callbacks)
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-1',
      'completed',
      expect.objectContaining({
        total: 2,
        passed: 2,
        failed: 0,
        avgScore: 1,
        avgTokensPerSecond: 60,
        minTokensPerSecond: 60,
        maxTokensPerSecond: 60,
        avgTimeToFirstTokenMs: 100,
        minTimeToFirstTokenMs: 100,
        maxTimeToFirstTokenMs: 100
      }),
      undefined
    )
  })

  it('computes aggregate with mixed pass/fail results', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    mockApi.chat.mockResolvedValue(makeChatResponse('ok'))
    mockEvaluate
      .mockResolvedValueOnce({ passed: true, score: 1, evalResults: [] })
      .mockResolvedValueOnce({ passed: false, score: 0, evalResults: [] })
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(testCases), callbacks)
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-1',
      'completed',
      expect.objectContaining({
        total: 2,
        passed: 1,
        failed: 1,
        avgScore: 0.5
      }),
      undefined
    )
  })

  it('omits avg/min/max metrics from aggregate when all cases fail with no metrics', async () => {
    mockApi.chat.mockRejectedValue(new Error('network error'))
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(), makeSuite(), callbacks)
    const aggregate = (callbacks.onModelRunComplete as ReturnType<typeof vi.fn>).mock.calls[0][2]
    expect(aggregate.avgTokensPerSecond).toBeUndefined()
    expect(aggregate.minTokensPerSecond).toBeUndefined()
    expect(aggregate.maxTokensPerSecond).toBeUndefined()
    expect(aggregate.avgTimeToFirstTokenMs).toBeUndefined()
    expect(aggregate.minTimeToFirstTokenMs).toBeUndefined()
    expect(aggregate.maxTimeToFirstTokenMs).toBeUndefined()
  })

  it('computes separate aggregates per model run', async () => {
    const modelRuns = [makeModelRun({ id: 'mr-1' }), makeModelRun({ id: 'mr-2' })]
    mockApi.chat
      .mockResolvedValueOnce(makeChatResponse('ok', 40, 0.05))
      .mockResolvedValueOnce(makeChatResponse('ok', 80, 0.15))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const callbacks = makeCallbacks()
    await executeTestRun(makeRun(modelRuns), makeSuite(), callbacks)
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-1',
      'completed',
      expect.objectContaining({ avgTokensPerSecond: 40 }),
      undefined
    )
    expect(callbacks.onModelRunComplete).toHaveBeenCalledWith(
      'mr-2',
      'completed',
      expect.objectContaining({ avgTokensPerSecond: 80 }),
      undefined
    )
  })
})
