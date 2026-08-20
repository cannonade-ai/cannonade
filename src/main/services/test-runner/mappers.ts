import type { TestCase, RunConfig } from '@shared/app/test-suite'
import type { ChatRequest, OutputItem } from '@shared/provider/chat'

export function buildRequest(
  testCase: TestCase,
  modelKey: string,
  defaultRunConfig?: RunConfig
): ChatRequest {
  const { input } = testCase
  const runConfig: RunConfig | undefined =
    testCase.runConfig || defaultRunConfig
      ? { ...defaultRunConfig, ...testCase.runConfig }
      : undefined
  const base: Partial<ChatRequest> = {
    model: modelKey,
    max_output_tokens: runConfig?.maxTokens,
    temperature: runConfig?.temperature,
    top_p: runConfig?.topP,
    top_k: runConfig?.topK,
    min_p: runConfig?.minP,
    repeat_penalty: runConfig?.repeatPenalty,
    frequency_penalty: runConfig?.frequencyPenalty,
    presence_penalty: runConfig?.presencePenalty,
    seed: runConfig?.seed,
    extra_request_data: runConfig?.extraRequestData
  }

  if (input.type === 'chat' && input.messages?.length) {
    return { ...base, model: modelKey, messages: input.messages.map((m) => ({ ...m })) }
  }

  return { ...base, model: modelKey, input: input.prompt ?? '' }
}

export function extractTextOutput(output: OutputItem[]): string {
  return output
    .filter((o) => o.type === 'message')
    .map((o) => (o as { type: 'message'; content: string }).content)
    .join('\n')
}

export function extractReasoningOutput(output: OutputItem[]): string | undefined {
  const reasoning = output
    .filter((o) => o.type === 'reasoning')
    .map((o) => (o as { type: 'reasoning'; content: string }).content)
    .join('\n')
    .trim()
  return reasoning || undefined
}
