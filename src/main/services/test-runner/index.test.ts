import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeTestRun } from './index'
import { RUN } from '@shared/app/ipc-channels'
import type { TestRun, PerModelRun, RunStatus } from '@shared/app/test-run'
import type {
  TestSuite,
  TestCase,
  EvaluationConfig,
  AggregateMetrics
} from '@shared/app/test-suite'
import type { ChatResponse } from '@shared/provider/chat'

vi.mock('../../../core/providers/registry')
vi.mock('../../eval/evaluator')
vi.mock('../../ipc/test-run-handlers', () => ({ saveTestRun: vi.fn() }))

import { getProvider } from '../../../core/providers/registry'
import { evaluateAll } from '../../eval/evaluator'

const mockGetProvider = vi.mocked(getProvider)
const mockEvaluate = vi.mocked(evaluateAll)

const mockChat = vi.fn()
const mockFetchLocalModels = vi.fn()
const mockDownloadModel = vi.fn()
const mockGetDownloadStatus = vi.fn()
const mockLoadModel = vi.fn()

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
  mockLoadModel.mockResolvedValue(undefined)
  mockGetProvider.mockReturnValue({
    id: 'lmstudio',
    capabilities: capabilities,
    chat: mockChat,
    fetchLocalModels: mockFetchLocalModels,
    downloadModel: mockDownloadModel,
    getDownloadStatus: mockGetDownloadStatus,
    loadModel: mockLoadModel
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

  it('loads the model and emits MODEL_LOADING before running cases', async () => {
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(mockLoadModel).toHaveBeenCalledWith('llama-3')
    expect(send).toHaveBeenCalledWith(RUN.MODEL_LOADING, { modelRunId: 'mr-1' })
    const channels = send.mock.calls.map(([ch]) => ch)
    expect(channels.indexOf(RUN.MODEL_LOADING)).toBeLessThan(channels.indexOf(RUN.CASE_STARTED))
  })

  it('skips loading when the model already has a loaded instance', async () => {
    mockFetchLocalModels.mockResolvedValue([{ id: 'llama-3', loadedInstances: [{ id: 'inst-1' }] }])
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(mockLoadModel).not.toHaveBeenCalled()
    const channels = send.mock.calls.map(([ch]) => ch)
    expect(channels).not.toContain(RUN.MODEL_LOADING)
  })

  it('fails the model run when loading the model throws', async () => {
    mockLoadModel.mockRejectedValue(new Error('out of memory'))
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(mockChat).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledWith(RUN.MODEL_COMPLETED, {
      modelRunId: 'mr-1',
      status: 'failed',
      aggregate: expect.any(Object),
      error: 'out of memory'
    })
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
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'llama-3-8b' }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
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
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'meta/llama-3' }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
  })

  it('uses modelId directly and skips download and load for external model refs', async () => {
    mockGetProvider.mockReturnValue({
      id: 'openrouter',
      capabilities: {
        ...capabilities,
        localModels: false,
        externalModels: true,
        downloadModel: false,
        downloadStatus: false,
        deleteModel: false,
        loadModel: false,
        serverControl: false,
        requiresApiKey: true
      },
      chat: mockChat
    })
    const modelRun = makeModelRun({
      modelRef: { source: 'external', modelId: 'openai/gpt-4' }
    })
    const send = makeSend()
    await executeTestRun(makeRun([modelRun]), makeSuite(), send)
    expect(mockDownloadModel).not.toHaveBeenCalled()
    expect(mockLoadModel).not.toHaveBeenCalled()
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'openai/gpt-4' }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'completed' })
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
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'liquid/lfm2-350m' }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
  })
})

describe('executeTestRun – request building', () => {
  it('builds a completion request from prompt input', async () => {
    const testCase = makeTestCase({ input: { type: 'completion', prompt: 'Say hello' } })
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), makeSend())
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ input: 'Say hello' }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
  })

  it('passes multi-turn messages through in the chat request', async () => {
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
      expect.objectContaining({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' }
        ]
      }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
    )
  })

  it('keeps system messages in the passed-through chat messages', async () => {
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
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ]
      }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
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
      expect.objectContaining({ temperature: 0.7, top_p: 0.9, max_output_tokens: 256 }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) })
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
            score: 1,
            durationMs: expect.any(Number)
          }
        }),
        aggregate: expect.objectContaining({
          avgScore: 1,
          avgTokensPerSecond: 100,
          avgTimeToFirstTokenMs: 200,
          avgDurationMs: expect.any(Number),
          minDurationMs: expect.any(Number),
          maxDurationMs: expect.any(Number),
          totalDurationMs: expect.any(Number)
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

describe('executeTestRun – reasoning extraction', () => {
  it('sets result reasoning from reasoning output items', async () => {
    mockChat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'reasoning', content: 'let me think' },
        { type: 'message', content: 'final answer' }
      ]
    })
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        result: expect.objectContaining({ output: 'final answer', reasoning: 'let me think' })
      })
    )
  })

  it('joins multiple reasoning items with newline', async () => {
    mockChat.mockResolvedValue({
      ...makeChatResponse(''),
      output: [
        { type: 'reasoning', content: 'step one' },
        { type: 'reasoning', content: 'step two' },
        { type: 'message', content: 'final answer' }
      ]
    })
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        result: expect.objectContaining({ reasoning: 'step one\nstep two' })
      })
    )
  })

  it('trims surrounding whitespace from reasoning', async () => {
    mockChat.mockResolvedValue({
      ...makeChatResponse('answer'),
      output: [
        { type: 'reasoning', content: '\n  let me think\n' },
        { type: 'message', content: 'answer' }
      ]
    })
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(
      RUN.CASE_COMPLETED,
      expect.objectContaining({
        result: expect.objectContaining({ reasoning: 'let me think' })
      })
    )
  })

  it('leaves reasoning undefined when no reasoning output is present', async () => {
    mockChat.mockResolvedValue(makeChatResponse('plain answer'))
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    const call = send.mock.calls.find(([channel]) => channel === RUN.CASE_COMPLETED)
    expect(call?.[1]).toMatchObject({ result: { output: 'plain answer' } })
    expect((call?.[1] as { result: { reasoning?: string } }).result.reasoning).toBeUndefined()
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

describe('executeTestRun – timeout and cancellation', () => {
  it('passes the case timeoutMs to abort the chat and records a timeout error', async () => {
    const testCase = makeTestCase({ id: 'tc-1', timeoutMs: 20 })
    mockChat.mockImplementation(
      (_req, opts?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => reject(new Error('should not surface')))
        })
    )
    const send = makeSend()
    await executeTestRun(makeRun([makeModelRun()], [testCase]), makeSuite([testCase]), send)
    const call = send.mock.calls.find(([ch]) => ch === RUN.CASE_COMPLETED)
    expect((call?.[1] as { result: { error: string } }).result.error).toMatch(
      /Timed out after 20ms/
    )
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'failed' })
  })

  it('falls back to the run config default timeout when the case has none', async () => {
    const testCase = makeTestCase({ id: 'tc-1' })
    mockChat.mockImplementation(
      (_req, opts?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
    )
    const send = makeSend()
    const run = makeRun([makeModelRun()], [testCase])
    run.config.defaultTestCaseTimeout = 15
    await executeTestRun(run, makeSuite([testCase]), send)
    const call = send.mock.calls.find(([ch]) => ch === RUN.CASE_COMPLETED)
    expect((call?.[1] as { result: { error: string } }).result.error).toMatch(
      /Timed out after 15ms/
    )
  })

  it('does not time out when no timeout is configured', async () => {
    const send = makeSend()
    await executeTestRun(makeRun(), makeSuite(), send)
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'completed' })
  })

  it('cancels the in-flight case and stops the run when the signal aborts', async () => {
    const controller = new AbortController()
    const testCases = [makeTestCase({ id: 'tc-1' }), makeTestCase({ id: 'tc-2' })]
    mockChat.mockImplementation(
      (_req, opts?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          controller.abort()
          opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
    )
    const send = makeSend()
    await executeTestRun(
      makeRun([makeModelRun()], testCases),
      makeSuite(testCases),
      send,
      controller.signal
    )
    const caseCompletedCalls = send.mock.calls.filter(([ch]) => ch === RUN.CASE_COMPLETED)
    expect(caseCompletedCalls).toHaveLength(1)
    expect(caseCompletedCalls[0][1]).toMatchObject({ status: 'cancelled', testCaseId: 'tc-1' })
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'cancelled' })
    expect(mockChat).toHaveBeenCalledTimes(1)
  })
})

describe('executeTestRun – parallel execution', () => {
  const externalCapabilities = {
    ...capabilities,
    localModels: false,
    externalModels: true,
    downloadModel: false,
    downloadStatus: false,
    deleteModel: false,
    loadModel: false,
    serverControl: false,
    requiresApiKey: true
  }

  function useExternalProvider(): void {
    mockGetProvider.mockReturnValue({
      id: 'openrouter',
      capabilities: externalCapabilities,
      chat: mockChat
    })
  }

  function trackConcurrency(): { readonly max: number } {
    const tracker = { active: 0, max: 0 }
    mockChat.mockImplementation(async () => {
      tracker.active++
      tracker.max = Math.max(tracker.max, tracker.active)
      await new Promise((resolve) => setTimeout(resolve, 10))
      tracker.active--
      return makeChatResponse('ok')
    })
    return tracker
  }

  function makeExternalModelRuns(): PerModelRun[] {
    return [
      makeModelRun({ id: 'mr-1', modelRef: { source: 'external', modelId: 'openai/gpt-4' } }),
      makeModelRun({ id: 'mr-2', modelRef: { source: 'external', modelId: 'openai/gpt-4o' } })
    ]
  }

  it('runs model runs concurrently when parallelRun is enabled', async () => {
    useExternalProvider()
    const tracker = trackConcurrency()
    const send = makeSend()
    const run = makeRun(makeExternalModelRuns())
    run.config.parallelRun = true
    await executeTestRun(run, makeSuite(), send)
    expect(tracker.max).toBe(2)
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'completed' })
    const modelCompletedCalls = send.mock.calls.filter(([ch]) => ch === RUN.MODEL_COMPLETED)
    expect(modelCompletedCalls).toHaveLength(2)
  })

  it('runs model runs sequentially when parallelRun is not enabled', async () => {
    useExternalProvider()
    const tracker = trackConcurrency()
    const run = makeRun(makeExternalModelRuns())
    await executeTestRun(run, makeSuite(), makeSend())
    expect(tracker.max).toBe(1)
  })

  it('ignores parallelRun for providers with local models', async () => {
    const tracker = trackConcurrency()
    const run = makeRun([makeModelRun({ id: 'mr-1' }), makeModelRun({ id: 'mr-2' })])
    run.config.parallelRun = true
    await executeTestRun(run, makeSuite(), makeSend())
    expect(tracker.max).toBe(1)
  })

  it('marks the run failed when one parallel model run fails', async () => {
    useExternalProvider()
    mockChat
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce(makeChatResponse('ok'))
    const send = makeSend()
    const run = makeRun(makeExternalModelRuns())
    run.config.parallelRun = true
    await executeTestRun(run, makeSuite(), send)
    expect(send).toHaveBeenCalledWith(RUN.COMPLETED, { runId: 'run-1', status: 'failed' })
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
          maxTimeToFirstTokenMs: 100,
          avgDurationMs: expect.any(Number),
          minDurationMs: expect.any(Number),
          maxDurationMs: expect.any(Number),
          totalDurationMs: expect.any(Number)
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
    expect(aggregate.avgDurationMs).toBeUndefined()
    expect(aggregate.minDurationMs).toBeUndefined()
    expect(aggregate.maxDurationMs).toBeUndefined()
    expect(aggregate.totalDurationMs).toBeUndefined()
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
