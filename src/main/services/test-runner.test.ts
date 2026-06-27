import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeTestRun } from './test-runner'
import { RUN } from '@shared/app/ipc-channels'
import type { TestRun, PerModelRun, RunStatus } from '@shared/app/test-run'
import type {
  TestSuite,
  TestCase,
  EvaluationConfig,
  AggregateMetrics
} from '@shared/app/test-suite'
import type { ChatResponse } from '@shared/provider/chat'

vi.mock('../../core/providers/registry')
vi.mock('../eval/evaluator')
vi.mock('../ipc/test-run-handlers', () => ({ saveTestRun: vi.fn() }))

import { getProvider } from '../../core/providers/registry'
import { evaluateAll } from '../eval/evaluator'

const mockGetProvider = vi.mocked(getProvider)
const mockEvaluate = vi.mocked(evaluateAll)

const mockChat = vi.fn()
const mockFetchLocalModels = vi.fn()
const mockDownloadModel = vi.fn()
const mockGetDownloadStatus = vi.fn()

const capabilities = {
  chat: true,
  localModels: true,
  externalModels: false,
  downloadModel: true,
  downloadStatus: true,
  deleteModel: true,
  loadModel: true,
  serverControl: true,
  requiresApiKey: false,
  modelRegistryUrl: '',
  huggingFaceModelsUrl: 'https://huggingface.co/models'
}

type SendMock = ReturnType<typeof vi.fn> & ((channel: string, payload: unknown) => void)

function makeSend(): SendMock {
  return vi.fn() as SendMock
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

function makeRun(
  modelRuns: PerModelRun[] = [makeModelRun()],
  testCases: TestCase[] = [makeTestCase()]
): TestRun {
  const populatedModelRuns = modelRuns.map((mr) => ({
    ...mr,
    caseRuns: testCases.map((tc) => ({ testCaseId: tc.id, status: 'pending' as RunStatus }))
  }))
  return {
    id: 'run-1',
    suiteId: 'suite-1',
    suiteName: 'Suite 1',
    config: { suiteId: 'suite-1', provider: 'lmstudio', providerName: 'LM Studio', models: [] },
    status: 'pending',
    createdAt: new Date().toISOString(),
    modelRuns: populatedModelRuns
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
  mockChat.mockResolvedValue(makeChatResponse('hello'))
  mockFetchLocalModels.mockResolvedValue([])
  mockDownloadModel.mockResolvedValue({ job_id: '', status: 'already_downloaded' })
  mockGetProvider.mockReturnValue({
    id: 'lmstudio',
    capabilities: capabilities,
    chat: mockChat,
    fetchLocalModels: mockFetchLocalModels,
    downloadModel: mockDownloadModel,
    getDownloadStatus: mockGetDownloadStatus
  })
})

describe('executeTestRun – callback sequence', () => {
  it('calls onRunStart with the run id', async () => {
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(RUN.STARTED, { runId: 'run-1' })
  })

  it('calls onModelRunStart for each model run', async () => {
    const testCases = [makeTestCase()]
    const modelRuns = [makeModelRun({ id: 'mr-1' }), makeModelRun({ id: 'mr-2' })]
    const send = makeSend()
    await executeTestRun(makeRun(modelRuns, testCases), makeSuite(testCases), send)
    expect(send).toHaveBeenCalledWith(RUN.MODEL_STARTED, {
      modelRunId: 'mr-1',
      autoDownloaded: false
    })
    expect(send).toHaveBeenCalledWith(RUN.MODEL_STARTED, {
      modelRunId: 'mr-2',
      autoDownloaded: false
    })
    const modelStartedCalls = send.mock.calls.filter(([ch]) => ch === RUN.MODEL_STARTED)
    expect(modelStartedCalls).toHaveLength(2)
  })

  it('calls onCaseComplete once per test case per model run', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], testCases), makeSuite(testCases), send)
    const caseCompletedCalls = send.mock.calls.filter(([ch]) => ch === RUN.CASE_COMPLETED)
    expect(caseCompletedCalls).toHaveLength(2)
  })

  it('calls onModelRunComplete after each model run completes', async () => {
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(RUN.MODEL_COMPLETED, {
      modelRunId: 'mr-1',
      status: 'completed',
      aggregate: expect.any(Object),
      error: undefined
    })
  })
})

describe('executeTestRun – model key resolution', () => {
  it('uses modelKey for installed model refs', async () => {
    const modelRun = makeModelRun({ modelRef: { source: 'installed', modelKey: 'llama-3-8b' } })
    await executeTestRun(makeRun([modelRun]), makeSuite(), makeSend())
    expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({ model: 'llama-3-8b' }))
  })

  it('uses modelId for huggingface model refs', async () => {
    mockFetchLocalModels.mockResolvedValue([
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
    await executeTestRun(makeRun([modelRun]), makeSuite(), makeSend())
    expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({ model: 'meta/llama-3' }))
  })

  it('downloads the raw model id and resolves the key for registry model refs', async () => {
    mockFetchLocalModels.mockResolvedValue([
      {
        id: 'liquid/lfm2-350m',
        name: 'lfm2-350m',
        providerId: 'lmstudio',
        sizeBytes: 0,
        type: 'llm',
        loadedInstances: [],
        meta: {}
      }
    ])
    mockDownloadModel.mockResolvedValue({ job_id: 'job-1', status: 'downloading' })
    mockGetDownloadStatus.mockResolvedValue({ job_id: 'job-1', status: 'completed' })
    const modelRun = makeModelRun({
      modelRef: { source: 'registry', modelId: 'liquid/lfm2-350m' }
    })
    await executeTestRun(makeRun([modelRun]), makeSuite(), makeSend())
    expect(mockDownloadModel).toHaveBeenCalledWith('liquid/lfm2-350m')
    expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({ model: 'liquid/lfm2-350m' }))
  })
})

describe('executeTestRun – request building', () => {
  it('builds a completion request from prompt input', async () => {
    const testCase = makeTestCase({ input: { type: 'completion', prompt: 'Say hello' } })
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), makeSend())
    expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({ input: 'Say hello' }))
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
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), makeSend())
    expect(mockChat).toHaveBeenCalledWith(
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
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), makeSend())
    expect(mockChat).toHaveBeenCalledWith(
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
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), makeSend())
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.7, top_p: 0.9, max_output_tokens: 256 })
    )
  })
})

describe('executeTestRun – output extraction', () => {
  it('passes extracted message content to evaluate', async () => {
    mockChat.mockResolvedValue(makeChatResponse('extracted output'))
    await executeTestRun(makeRun(), makeSuite(), makeSend())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'extracted output',
      expect.objectContaining({ id: 'tc-1' })
    )
  })

  it('ignores non-message output items', async () => {
    mockChat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'reasoning', content: 'thinking...' },
        { type: 'message', content: 'final answer' }
      ]
    })
    await executeTestRun(makeRun(), makeSuite(), makeSend())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'final answer',
      expect.objectContaining({ id: 'tc-1' })
    )
  })

  it('joins multiple message outputs with newline', async () => {
    mockChat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'message', content: 'part one' },
        { type: 'message', content: 'part two' }
      ]
    })
    await executeTestRun(makeRun(), makeSuite(), makeSend())
    expect(mockEvaluate).toHaveBeenCalledWith(
      'part one\npart two',
      expect.objectContaining({ id: 'tc-1' })
    )
  })
})

describe('executeTestRun – case result construction', () => {
  it('maps response stats to result metrics', async () => {
    mockChat.mockResolvedValue(makeChatResponse('hello', 100, 0.2))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-1',
        testCaseId: 'tc-1',
        result: expect.objectContaining({
          metrics: {
            tokensPerSecond: 100,
            timeToFirstTokenMs: 200,
            score: 1
          }
        }),
        aggregate: expect.objectContaining({
          avgScore: 1,
          avgTokensPerSecond: 100,
          avgTimeToFirstTokenMs: 200
        })
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
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        result: expect.objectContaining({
          passed: false,
          error: 'no match'
        }),
        aggregate: expect.objectContaining({
          avgScore: 0,
          avgTokensPerSecond: 50,
          avgTimeToFirstTokenMs: 100
        })
      })
    )
  })
})

describe('executeTestRun – error handling', () => {
  it('records per-case API error and continues to next case', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    mockChat
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(makeChatResponse('ok'))
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], testCases), makeSuite(testCases), send)
    const caseCompletedCalls = send.mock.calls.filter(([ch]) => ch === RUN.CASE_COMPLETED)
    expect(caseCompletedCalls).toHaveLength(2)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-1',
        testCaseId: 'tc-1',
        result: expect.objectContaining({
          testCaseId: 'tc-1',
          passed: false,
          error: 'network error',
          output: '',
          metrics: {}
        }),
        aggregate: expect.objectContaining({
          avgScore: 0,
          failed: 1,
          passed: 0
        })
      })
    )
  })

  it('marks model run as failed on fatal error from buildRequest', async () => {
    const badTestCase = { ...makeTestCase(), input: null as unknown as TestCase['input'] }
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], [badTestCase]), makeSuite([badTestCase]), send)
    expect(send).toHaveBeenCalledWith(
      RUN.MODEL_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-1',
        status: 'failed',
        error: expect.any(String)
      })
    )
  })

  it('marks overall run as failed when any model run encounters a fatal error', async () => {
    const badTestCase = { ...makeTestCase(), input: null as unknown as TestCase['input'] }
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], [badTestCase]), makeSuite([badTestCase]), send)
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'failed' })
  })

  it('marks overall run as completed when all model runs succeed', async () => {
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'completed' })
  })
})

describe('executeTestRun – aggregate metrics', () => {
  it('computes correct aggregate for all passing results', async () => {
    mockChat.mockResolvedValue(makeChatResponse('ok', 60, 0.1))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], testCases), makeSuite(testCases), send)
    expect(send).toHaveBeenCalledWith(
      RUN.MODEL_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-1',
        status: 'completed',
        aggregate: expect.objectContaining({
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
        error: undefined
      })
    )
  })

  it('computes aggregate with mixed pass/fail results', async () => {
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    mockChat.mockResolvedValue(makeChatResponse('ok'))
    mockEvaluate
      .mockResolvedValueOnce({ passed: true, score: 1, evalResults: [] })
      .mockResolvedValueOnce({ passed: false, score: 0, evalResults: [] })
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], testCases), makeSuite(testCases), send)
    expect(send).toHaveBeenCalledWith(
      RUN.MODEL_COMPLETED,
      expect.objectContaining({
        aggregate: expect.objectContaining({
          total: 2,
          passed: 1,
          failed: 1,
          avgScore: 0.5
        })
      })
    )
  })

  it('omits avg/min/max metrics from aggregate when all cases fail with no metrics', async () => {
    mockChat.mockRejectedValue(new Error('network error'))
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    const modelCompletedCall = send.mock.calls.find(([ch]) => ch === RUN.MODEL_COMPLETED)
    const aggregate = (modelCompletedCall![1] as { aggregate: AggregateMetrics }).aggregate
    expect(aggregate.avgTokensPerSecond).toBeUndefined()
    expect(aggregate.minTokensPerSecond).toBeUndefined()
    expect(aggregate.maxTokensPerSecond).toBeUndefined()
    expect(aggregate.avgTimeToFirstTokenMs).toBeUndefined()
    expect(aggregate.minTimeToFirstTokenMs).toBeUndefined()
    expect(aggregate.maxTimeToFirstTokenMs).toBeUndefined()
  })

  it('computes separate aggregates per model run', async () => {
    const testCases = [makeTestCase()]
    const modelRuns = [makeModelRun({ id: 'mr-1' }), makeModelRun({ id: 'mr-2' })]
    mockChat
      .mockResolvedValueOnce(makeChatResponse('ok', 40, 0.05))
      .mockResolvedValueOnce(makeChatResponse('ok', 80, 0.15))
    mockEvaluate.mockResolvedValue({ passed: true, score: 1, evalResults: [] })
    const send = makeSend()
    await executeTestRun(makeRun(modelRuns, testCases), makeSuite(testCases), send)
    expect(send).toHaveBeenCalledWith(
      RUN.MODEL_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-1',
        aggregate: expect.objectContaining({ avgTokensPerSecond: 40 })
      })
    )
    expect(send).toHaveBeenCalledWith(
      RUN.MODEL_COMPLETED,
      expect.objectContaining({
        modelRunId: 'mr-2',
        aggregate: expect.objectContaining({ avgTokensPerSecond: 80 })
      })
    )
  })
})
