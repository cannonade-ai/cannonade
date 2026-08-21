<script setup lang="ts">
import {
  Badge,
  Chevron,
  CollapseTransition,
  CopyButton,
  HtmlPreview,
  Textarea,
  Tooltip
} from '@renderer/components/ui'
import type { TestCaseRun } from '@shared/app/test-run'
import type {
  EvaluationMethodResult,
  TestCase,
  TestCaseMetrics,
  TestCaseResult
} from '@shared/app/test-suite'
import type { JudgeUsage } from '@shared/app/judge'
import type { FieldVisibility } from '@shared/app/field-visibility'
import type { ChatMessage } from '@shared/provider/chat'
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconCode,
  IconEye,
  IconLoader2,
  IconX
} from '@tabler/icons-vue'
import { shouldOfferHtmlPreview } from '@renderer/utils/html-output'
import { useSettingsStore } from '@renderer/stores/settings'
import { DEFAULT_THRESHOLD, scoreColorStyle, scoreThreshold } from '@renderer/utils/score-color'
import { summarizeEvaluation } from '@renderer/utils/evaluation-summary'
import { computed, ref } from 'vue'

const props = defineProps<{
  testCase: TestCase
  caseRun?: TestCaseRun
}>()

const settings = useSettingsStore()

const show = computed<FieldVisibility>(() => settings.fieldVisibility)

const expanded = ref(false)
const htmlPreview = ref(settings.htmlPreviewByDefault)

const canPreviewHtml = computed<boolean>(() =>
  shouldOfferHtmlPreview(props.caseRun?.result?.output, props.testCase.evaluations)
)

function toggle(): void {
  if (!props.caseRun?.result) return
  expanded.value = !expanded.value
}

const effectiveStatus = computed<string>(() => {
  const result = props.caseRun?.result
  if (result) return result.passed ? 'passed' : 'failed'
  return props.caseRun?.status ?? 'pending'
})

function scoreLabel(result: TestCaseResult): string {
  if (result.metrics.score == null) return '—'
  return (result.metrics.score * 100).toFixed(0) + '%'
}

const caseThreshold = computed<number>(() =>
  scoreThreshold(props.testCase.evaluations, props.testCase.passingLogic)
)

const scoreStyle = computed<Record<string, string>>(() =>
  scoreColorStyle(props.caseRun?.result?.metrics.score, caseThreshold.value)
)

const systemPrompt = computed<string | null>(() => {
  const msg = props.testCase.input.messages?.find((m) => m.role === 'system')
  return msg?.content ?? null
})

const inputMessages = computed<ChatMessage[]>(() => {
  return props.testCase.input.messages?.filter((m) => m.role !== 'system') ?? []
})

const inputPrompt = computed<string | null>(() => {
  return props.testCase.input.prompt ?? null
})

interface EvaluationDisplay {
  expected: string
  expectedPreview: string | null
  negated: boolean
  thresholdTooltip: string
}

const PREVIEW_LENGTH = 20
function previewOf(text: string | null): string | null {
  if (!text) return null
  return text.length > PREVIEW_LENGTH
    ? text.replaceAll('\n', '').slice(0, PREVIEW_LENGTH) + '…'
    : text
}

const evaluationDisplays = computed<EvaluationDisplay[]>(() =>
  props.testCase.evaluations.map((evaluation) => {
    const expected = summarizeEvaluation(evaluation)
    const threshold = evaluation.threshold ?? DEFAULT_THRESHOLD
    return {
      expected: expected ?? '',
      expectedPreview: previewOf(expected),
      negated: evaluation.negate === true,
      thresholdTooltip: `Passes at ${(threshold * 100).toFixed(0)}% or above`
    }
  })
)

function evalResultState(result: EvaluationMethodResult): string {
  if (result.error) return 'errored'
  return result.passed ? 'passed' : 'failed'
}

function judgeTooltip(judgeUsage: JudgeUsage): string {
  const parts = [`Graded by ${judgeUsage.model}`]
  if (judgeUsage.totalTokens != null)
    parts.push(`${formatTokens(judgeUsage.totalTokens)} judge tokens`)
  if (judgeUsage.cost != null) parts.push(`${formatCost(judgeUsage.cost)} judge cost`)
  return parts.join(' · ')
}

function formatMetricValue(value: number | undefined, suffix: string): string {
  if (value == null) return '—'
  return value.toFixed(1) + suffix
}

const metrics = computed<TestCaseMetrics | undefined>(() => props.caseRun?.result?.metrics)

function formatCost(cost: number): string {
  if (cost >= 1) return `$${cost.toFixed(2)}`
  if (cost >= 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(6)}`
}

function formatTokens(count: number): string {
  return count.toLocaleString()
}

function ttft(result: TestCaseResult): string {
  if (result.metrics.timeToFirstTokenMs == null) return '—'
  return result.metrics.timeToFirstTokenMs.toFixed(0) + 'ms'
}

function formatDurationMs(ms: number | undefined): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function duration(caseRun: TestCaseRun): string {
  if (!caseRun.startedAt || !caseRun.completedAt) return '—'
  const ms = new Date(caseRun.completedAt).getTime() - new Date(caseRun.startedAt).getTime()
  return formatDurationMs(ms)
}

function getDurationLabel(caseRun: TestCaseRun): string {
  if (caseRun.result?.metrics?.durationMs) {
    return formatDurationMs(caseRun.result.metrics.durationMs)
  }
  return duration(caseRun)
}

const hasMetrics = computed<boolean>(() => {
  if (props.caseRun?.startedAt && props.caseRun?.completedAt) return true
  const metrics = props.caseRun?.result?.metrics
  if (!metrics) return false
  return (
    metrics.tokensPerSecond != null ||
    metrics.timeToFirstTokenMs != null ||
    metrics.durationMs != null ||
    metrics.score != null
  )
})
</script>

<template>
  <div class="test-case-row" :class="effectiveStatus">
    <button class="case-summary" :class="{ inactive: !caseRun?.result, expanded }" @click="toggle">
      <span class="status-bar" />
      <div class="summary-left">
        <span class="status-icon-wrap" :class="effectiveStatus">
          <IconCheck v-if="caseRun?.result?.passed" :size="13" :stroke-width="2.5" />
          <IconX
            v-else-if="caseRun?.result && !caseRun.result.passed"
            :size="13"
            :stroke-width="2.5"
          />
          <IconLoader2
            v-else-if="caseRun?.status === 'running'"
            :size="13"
            :stroke-width="2"
            class="spin"
          />
          <IconClock v-else :size="13" :stroke-width="2" />
        </span>
        <div class="case-info">
          <span class="case-name">{{ testCase.name }}</span>
          <span v-if="testCase.description" class="case-description">
            {{ testCase.description }}
          </span>
        </div>
      </div>

      <div v-if="caseRun?.result" class="summary-right">
        <span class="score score-value" :style="scoreStyle">
          {{ scoreLabel(caseRun.result) }}
        </span>
        <Chevron :expanded="expanded" />
      </div>
    </button>

    <CollapseTransition :open="expanded">
      <div v-if="caseRun?.result" class="case-details">
        <div v-if="caseRun.result.error" class="detail-block error-block">
          <span class="detail-label">Error</span>
          <span class="detail-value error-text">{{ caseRun.result.error }}</span>
        </div>

        <div v-if="systemPrompt && show.systemPrompt" class="detail-block">
          <span class="detail-label">System Prompt</span>
          <Textarea
            :model-value="systemPrompt ?? undefined"
            variant="display"
            readonly
            copyable
            class="field-textarea"
          />
        </div>

        <div v-if="show.input && inputMessages.length > 0" class="detail-block">
          <div class="messages">
            <div
              v-for="(message, i) in inputMessages"
              :key="i"
              class="message"
              :class="message.role"
            >
              <span class="message-role">{{ message.role }}</span>
              <Textarea
                :model-value="message.content"
                variant="display"
                readonly
                copyable
                class="field-textarea"
              />
            </div>
          </div>
        </div>

        <div v-else-if="show.input && inputPrompt" class="detail-block">
          <span class="detail-label">Input</span>
          <Textarea
            :model-value="inputPrompt ?? undefined"
            variant="display"
            readonly
            copyable
            class="field-textarea"
          />
        </div>

        <div v-if="show.thinking && caseRun.result.reasoning" class="detail-block">
          <span class="detail-label">Thinking</span>
          <Textarea
            :model-value="caseRun.result.reasoning"
            variant="display"
            readonly
            copyable
            class="field-textarea"
          />
        </div>

        <div v-if="show.output && caseRun.result.output" class="detail-block">
          <div class="detail-label-row">
            <span class="detail-label">Actual Output</span>
            <button
              v-if="canPreviewHtml"
              v-tooltip="htmlPreview ? 'Show raw output' : 'Render as HTML'"
              class="preview-toggle"
              @click="htmlPreview = !htmlPreview"
            >
              <IconCode v-if="htmlPreview" :size="13" :stroke-width="2" />
              <IconEye v-else :size="13" :stroke-width="2" />
            </button>
          </div>
          <HtmlPreview v-if="canPreviewHtml && htmlPreview" :content="caseRun.result.output" />
          <Textarea
            v-else
            :model-value="caseRun.result.output"
            variant="display"
            readonly
            copyable
            class="field-textarea"
          />
        </div>

        <div v-if="show.evaluations && caseRun.result.evalResults?.length" class="detail-block">
          <span class="detail-label">
            Evaluation {{ testCase.evaluations.length > 1 ? '- ' + testCase.passingLogic : '' }}
          </span>
          <div class="eval-results">
            <div
              v-for="(result, i) in caseRun.result.evalResults"
              :key="i"
              class="eval-result"
              :class="evalResultState(result)"
            >
              <div class="eval-result__row">
                <div class="eval-result__cell eval-result__type">
                  <Badge v-if="evaluationDisplays[i]?.negated" type="info" square>Negated</Badge>
                  <span>{{ result.type.replace(/_/g, ' ') }}</span>
                </div>
                <div
                  v-if="evaluationDisplays[i]?.expectedPreview"
                  class="eval-result__cell eval-result__expected"
                >
                  <CopyButton :value="evaluationDisplays[i].expected" inset>
                    <Tooltip :delay="200" interactive>
                      <template #trigger>{{ evaluationDisplays[i].expectedPreview }}</template>
                      <template #content>
                        {{ evaluationDisplays[i].expected }}
                      </template>
                    </Tooltip>
                  </CopyButton>
                </div>
                <span v-if="result.details" class="eval-result__cell eval-result__detail">
                  {{ result.details }}
                </span>
                <span v-if="result.error" class="eval-result__cell eval-result__error">
                  <IconAlertTriangle :size="13" :stroke-width="2" />
                  {{ result.error }}
                </span>
                <span
                  v-if="result.judgeUsage"
                  v-tooltip="judgeTooltip(result.judgeUsage)"
                  class="eval-result__cell eval-result__judge"
                >
                  {{ result.judgeUsage.model }}
                </span>
                <span
                  v-if="result.error"
                  v-tooltip="'The grader itself failed, so this eval has no score'"
                  class="eval-result__cell eval-result__score errored"
                >
                  n/a
                </span>
                <span
                  v-else
                  v-tooltip="evaluationDisplays[i]?.thresholdTooltip"
                  class="eval-result__cell eval-result__score"
                  :class="result.passed ? 'pass' : 'fail'"
                >
                  {{ (result.score * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="show.metrics && hasMetrics" class="detail-block">
          <div class="case-metrics">
            <div v-if="caseRun.result.metrics.tokensPerSecond" class="case-metric">
              <span class="case-metric-label">Tok/s</span>
              <span class="case-metric-value">
                {{ formatMetricValue(caseRun.result.metrics.tokensPerSecond, '') }}
              </span>
            </div>
            <div v-if="caseRun.result.metrics.timeToFirstTokenMs" class="case-metric">
              <span class="case-metric-label">TTFT</span>
              <span class="case-metric-value">{{ ttft(caseRun.result) }}</span>
            </div>
            <div v-if="caseRun.result.metrics.score != null" class="case-metric">
              <span class="case-metric-label">Score</span>
              <span class="case-metric-value">{{ scoreLabel(caseRun.result) }}</span>
            </div>
            <div v-if="caseRun.startedAt && caseRun.completedAt" class="case-metric">
              <span class="case-metric-label">Duration</span>
              <span class="case-metric-value">{{ getDurationLabel(caseRun) }}</span>
            </div>
            <div v-if="metrics?.inputTokens" class="case-metric">
              <span class="case-metric-label">Input</span>
              <span class="case-metric-value">{{ formatTokens(metrics.inputTokens) }}</span>
            </div>
            <div v-if="metrics?.outputTokens" class="case-metric">
              <span class="case-metric-label">Output</span>
              <span class="case-metric-value">{{ formatTokens(metrics.outputTokens) }}</span>
            </div>
            <div v-if="metrics?.reasoningTokens" class="case-metric">
              <span class="case-metric-label">Reasoning</span>
              <span class="case-metric-value">{{ formatTokens(metrics.reasoningTokens) }}</span>
            </div>
            <div v-if="metrics?.cachedInputTokens" class="case-metric">
              <span class="case-metric-label">Cached</span>
              <span class="case-metric-value">{{ formatTokens(metrics.cachedInputTokens) }}</span>
            </div>
            <div v-if="metrics?.totalTokens" class="case-metric">
              <span class="case-metric-label">Total Tokens</span>
              <span class="case-metric-value">{{ formatTokens(metrics.totalTokens) }}</span>
            </div>
            <div v-if="metrics?.cost != null" class="case-metric">
              <span class="case-metric-label">Cost</span>
              <span class="case-metric-value">{{ formatCost(metrics.cost) }}</span>
            </div>
            <div v-if="metrics?.costBreakdown?.promptCost != null" class="case-metric">
              <span class="case-metric-label">Prompt Cost</span>
              <span class="case-metric-value">
                {{ formatCost(metrics.costBreakdown.promptCost) }}
              </span>
            </div>
            <div v-if="metrics?.judgeUsage?.totalTokens != null" class="case-metric">
              <span class="case-metric-label">Judge Tokens</span>
              <span class="case-metric-value">{{
                formatTokens(metrics.judgeUsage.totalTokens)
              }}</span>
            </div>
            <div v-if="metrics?.judgeUsage?.cost != null" class="case-metric">
              <span class="case-metric-label">Judge Cost</span>
              <span class="case-metric-value">{{ formatCost(metrics.judgeUsage.cost) }}</span>
            </div>
            <div v-if="metrics?.costBreakdown?.completionCost != null" class="case-metric">
              <span class="case-metric-label">Completion Cost</span>
              <span class="case-metric-value">
                {{ formatCost(metrics.costBreakdown.completionCost) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CollapseTransition>
  </div>
</template>

<style scoped lang="scss">
.test-case-row {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  overflow: hidden;

  &.passed .status-bar {
    background: #22c55e;
  }
  &.failed .status-bar {
    background: #ef4444;
  }
  &.running .status-bar {
    background: var(--accent);
  }
  &.pending .status-bar {
    background: transparent;
  }

  &.pending,
  &.running {
    .case-name {
      color: var(--text-secondary);
    }
  }

  .case-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    min-height: 2.75rem;

    &.expanded {
      background: var(--surface-elevated);
    }

    &:hover {
      background: var(--surface-hover);
    }

    &.inactive {
      cursor: default;

      &:hover {
        background: none;
      }
    }
  }

  .summary-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    margin: 0.5rem;
  }

  .status-bar {
    width: 3px;
    align-self: stretch;
    flex-shrink: 0;
  }

  .status-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    flex-shrink: 0;

    &.passed {
      color: #22c55e;
    }
    &.failed {
      color: #ef4444;
    }
    &.running {
      color: var(--accent);
    }
    &.pending {
      color: var(--text-muted);
    }
  }

  .case-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .case-name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .case-description {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .summary-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    margin: 0.5rem;
  }

  .eval-type {
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 2px 7px;
    background: var(--surface-elevated);
    color: var(--text-secondary);
  }

  .score {
    font-size: var(--text-sm);
    font-weight: 700;
    font-family: var(--font-headline);
    color: var(--text-primary);
    min-width: 36px;
    text-align: right;

    &.score-value {
      color: oklch(var(--score-l) var(--score-c) var(--score-h));
      transition: color 0.2s var(--ease-out);
    }
  }

  .case-details {
    border-top: 1px solid var(--border);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: inset 0 0 6px 2px var(--shadow);
  }

  .detail-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--text-muted);
  }

  .detail-label-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .preview-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 4px;
    background: none;
    border: 1px solid transparent;
    color: var(--accent);
    border-color: var(--accent-border);
    cursor: pointer;
    transition:
      color 0.15s,
      background 0.15s,
      border-color 0.15s;

    &:hover {
      color: var(--text-primary);
      background: var(--surface-hover);
    }
  }

  .detail-value {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    line-height: 1.5;

    &.error-text {
      color: #ef4444;
    }
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 3px;

    .message-role {
      font-size: var(--text-xs);
      font-weight: 700;
      text-transform: capitalize;
    }

    &.user .message-role {
      color: var(--accent, #6366f1);
    }
    &.assistant .message-role {
      color: #22c55e;
    }
  }

  .case-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
  }

  .case-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .case-metric-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .case-metric-value {
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-headline);
      color: var(--text-primary);
    }
  }

  .eval-results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .eval-result {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-left-width: 2px;
    overflow: hidden;

    &.passed {
      border-left-color: #22c55e;
    }
    &.failed {
      border-left-color: #ef4444;
    }
    &.errored {
      border-left-color: #f59e0b;
      border-style: dashed;
      border-left-style: solid;
    }

    &__row {
      display: flex;
      align-items: stretch;
      min-width: 0;
      height: 100%;
    }

    &__cell {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0.35rem 0.55rem;
      min-width: 0;
      white-space: nowrap;
      border-right: 1px solid var(--border);
    }

    &__type {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--text-primary);
      text-transform: capitalize;
    }

    &__expected {
      font-size: var(--text-xs);
      color: var(--text-muted);
      font-family: var(--font-mono, monospace);
    }

    &__detail {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      white-space: normal;
      max-width: 32rem;
    }

    &__error {
      font-size: var(--text-xs);
      color: #f59e0b;
      white-space: normal;
      max-width: 32rem;
    }

    &__judge {
      font-size: var(--text-xs);
      color: var(--text-muted);
      font-family: var(--font-mono, monospace);
    }

    &__score {
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-headline);

      &.pass {
        color: #22c55e;
      }
      &.fail {
        color: #ef4444;
      }
      &.errored {
        color: #f59e0b;
      }
    }
  }
}
</style>
