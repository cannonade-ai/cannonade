<script setup lang="ts">
import { Badge, Chevron, CopyButton, Textarea } from '@renderer/components/ui'
import type { TestCaseRun } from '@shared/app/test-run'
import type { ChatMessage, TestCase, TestCaseResult } from '@shared/app/test-suite'
import { IconCheck, IconClock, IconLoader2, IconX } from '@tabler/icons-vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  testCase: TestCase
  caseRun?: TestCaseRun
}>()

const expanded = ref(false)

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

function expectedForEval(index: number): string | null {
  const exp = props.testCase.evaluations[index]?.expected
  if (exp == null) return null
  const str = typeof exp === 'string' ? exp : JSON.stringify(exp)
  return str.length > 20 ? str.slice(0, 20) + '…' : str
}

function isNegated(index: number): boolean {
  return props.testCase.evaluations[index]?.negate === true
}

function fullExpectedForEval(index: number): string | null {
  const exp = props.testCase.evaluations[index]?.expected
  if (exp == null) return null
  const str = typeof exp === 'string' ? exp : JSON.stringify(exp)
  return str.length < 20 ? null : str
}

function formatMetricValue(value: number | undefined, suffix: string): string {
  if (value == null) return '—'
  return value.toFixed(1) + suffix
}

function ttft(result: TestCaseResult): string {
  if (result.metrics.timeToFirstTokenMs == null) return '—'
  return result.metrics.timeToFirstTokenMs.toFixed(0) + 'ms'
}

function duration(cr: TestCaseRun): string {
  if (!cr.startedAt || !cr.completedAt) return '—'
  const ms = new Date(cr.completedAt).getTime() - new Date(cr.startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const hasMetrics = computed<boolean>(() => {
  if (props.caseRun?.startedAt && props.caseRun?.completedAt) return true
  const m = props.caseRun?.result?.metrics
  if (!m) return false
  return m.tokensPerSecond != null || m.timeToFirstTokenMs != null || m.score != null
})
</script>

<template>
  <div class="test-case-row" :class="effectiveStatus">
    <button class="case-summary" :class="{ inactive: !caseRun?.result }" @click="toggle">
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
          <span v-if="testCase.description" class="case-description">{{
            testCase.description
          }}</span>
        </div>
      </div>

      <div v-if="caseRun?.result" class="summary-right">
        <span class="score">{{ scoreLabel(caseRun.result) }}</span>
        <Chevron :expanded="expanded" />
      </div>
    </button>

    <div v-if="expanded && caseRun?.result" class="case-details">
      <div v-if="caseRun.result.error" class="detail-block error-block">
        <span class="detail-label">Error</span>
        <span class="detail-value error-text">{{ caseRun.result.error }}</span>
      </div>

      <div v-if="systemPrompt" class="detail-block">
        <span class="detail-label">System Prompt</span>
        <Textarea
          :model-value="systemPrompt ?? undefined"
          variant="display"
          readonly
          copyable
          class="field-textarea"
        />
      </div>

      <div v-if="inputMessages.length > 0" class="detail-block">
        <div class="messages">
          <div v-for="(msg, i) in inputMessages" :key="i" class="message" :class="msg.role">
            <span class="message-role">{{ msg.role }}</span>
            <Textarea
              :model-value="msg.content"
              variant="display"
              readonly
              copyable
              class="field-textarea"
            />
          </div>
        </div>
      </div>

      <div v-else-if="inputPrompt" class="detail-block">
        <span class="detail-label">Input</span>
        <Textarea
          :model-value="inputPrompt ?? undefined"
          variant="display"
          readonly
          copyable
          class="field-textarea"
        />
      </div>

      <div class="outputs-grid">
        <div v-if="caseRun.result.output" class="output-col">
          <span class="detail-label">Actual Output</span>
          <Textarea
            :model-value="caseRun.result.output"
            variant="display"
            readonly
            copyable
            class="field-textarea"
          />
        </div>
      </div>

      <div v-if="caseRun.result.evalResults?.length" class="detail-block">
        <span class="detail-label">
          Evaluation {{ testCase.evaluations.length > 1 ? '- ' + testCase.passingLogic : '' }}
        </span>
        <div class="eval-results">
          <div
            v-for="(er, i) in caseRun.result.evalResults"
            :key="i"
            class="eval-result"
            :class="er.passed ? 'passed' : 'failed'"
          >
            <div class="eval-result__row">
              <div class="eval-result__cell eval-result__type">
                <Badge v-if="isNegated(i)" type="info" square>Negated</Badge>
                <span>{{ er.type.replace(/_/g, ' ') }}</span>
              </div>
              <div v-if="expectedForEval(i)" class="eval-result__cell eval-result__expected">
                <CopyButton :value="fullExpectedForEval(i) ?? ''" inset>
                  <span :title="fullExpectedForEval(i) ?? undefined">{{ expectedForEval(i) }}</span>
                </CopyButton>
              </div>
              <span v-if="er.details" class="eval-result__cell eval-result__detail">
                {{ er.details }}
              </span>
              <span v-if="er.error" class="eval-result__cell eval-result__error">
                {{ er.error }}
              </span>
              <span
                class="eval-result__cell eval-result__score"
                :class="er.passed ? 'pass' : 'fail'"
              >
                {{ (er.score * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMetrics" class="detail-block">
        <div class="case-metrics">
          <div v-if="caseRun.result.metrics.tokensPerSecond != null" class="case-metric">
            <span class="case-metric-label">Tok/s</span>
            <span class="case-metric-value">{{
              formatMetricValue(caseRun.result.metrics.tokensPerSecond, '')
            }}</span>
          </div>
          <div v-if="caseRun.result.metrics.timeToFirstTokenMs != null" class="case-metric">
            <span class="case-metric-label">TTFT</span>
            <span class="case-metric-value">{{ ttft(caseRun.result) }}</span>
          </div>
          <div v-if="caseRun.result.metrics.score != null" class="case-metric">
            <span class="case-metric-label">Score</span>
            <span class="case-metric-value">{{ scoreLabel(caseRun.result) }}</span>
          </div>
          <div v-if="caseRun.startedAt && caseRun.completedAt" class="case-metric">
            <span class="case-metric-label">Duration</span>
            <span class="case-metric-value">{{ duration(caseRun) }}</span>
          </div>
        </div>
      </div>
    </div>
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

    &:hover {
      background: var(--surface-hover, rgba(255, 255, 255, 0.04));
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
  }

  .case-details {
    border-top: 1px solid var(--border);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
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
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
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
    gap: 20px;
  }

  .case-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .case-metric-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
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
    border-left-width: 3px;
    overflow: hidden;

    &.passed {
      border-left-color: #22c55e;
    }
    &.failed {
      border-left-color: #ef4444;
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
    }

    &__error {
      font-size: var(--text-xs);
      color: #ef4444;
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
    }
  }

  .outputs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    &:has(.output-col:only-child) {
      grid-template-columns: 1fr;
    }
  }

  .output-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
