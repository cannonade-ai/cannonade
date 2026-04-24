<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconCheck, IconX, IconClock, IconLoader2, IconChevronDown } from '@tabler/icons-vue'
import type { TestCase, ChatMessage, TestCaseResult } from '@shared/app/test-suite'
import type { TestCaseRun } from '@shared/app/test-run'

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
  if (result.metrics.correctnessScore == null) return '—'
  return (result.metrics.correctnessScore * 100).toFixed(0) + '%'
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

const expectedOutput = computed<string | null>(() => {
  const exp = props.testCase.evaluation.expected
  if (exp == null) return null
  return typeof exp === 'string' ? exp : JSON.stringify(exp, null, 2)
})

function formatMetricValue(value: number | undefined, suffix: string): string {
  if (value == null) return '—'
  return value.toFixed(1) + suffix
}

function ttft(result: TestCaseResult): string {
  if (result.metrics.timeToFirstTokenMs == null) return '—'
  return result.metrics.timeToFirstTokenMs.toFixed(0) + 'ms'
}

const hasMetrics = computed<boolean>(() => {
  const m = props.caseRun?.result?.metrics
  if (!m) return false
  return m.tokensPerSecond != null || m.timeToFirstTokenMs != null || m.correctnessScore != null
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
        <span class="eval-type">{{ testCase.evaluation.type }}</span>
        <span class="score">{{ scoreLabel(caseRun.result) }}</span>
        <IconChevronDown
          :size="13"
          :stroke-width="2"
          class="chevron"
          :class="{ rotated: expanded }"
        />
      </div>
    </button>

    <div v-if="expanded && caseRun?.result" class="case-details">
      <div v-if="caseRun.result.error" class="detail-block error-block">
        <span class="detail-label">Error</span>
        <span class="detail-value error-text">{{ caseRun.result.error }}</span>
      </div>

      <div v-if="systemPrompt" class="detail-block">
        <span class="detail-label">System Prompt</span>
        <pre class="detail-pre">{{ systemPrompt }}</pre>
      </div>

      <div v-if="inputMessages.length > 0" class="detail-block">
        <div class="messages">
          <div v-for="(msg, i) in inputMessages" :key="i" class="message" :class="msg.role">
            <span class="message-role">{{ msg.role }}</span>
            <pre class="message-content">{{ msg.content }}</pre>
          </div>
        </div>
      </div>

      <div v-else-if="inputPrompt" class="detail-block">
        <span class="detail-label">Input</span>
        <pre class="detail-pre">{{ inputPrompt }}</pre>
      </div>

      <div class="outputs-grid">
        <div v-if="expectedOutput" class="output-col">
          <span class="detail-label">Expected Output</span>
          <pre class="detail-pre output-pre">{{ expectedOutput }}</pre>
        </div>
        <div v-if="caseRun.result.output" class="output-col">
          <span class="detail-label">Actual Output</span>
          <pre class="detail-pre output-pre">{{ caseRun.result.output }}</pre>
        </div>
      </div>

      <div v-if="caseRun.result.details != null" class="detail-block">
        <span class="detail-label">Details</span>
        <pre class="detail-pre">{{ JSON.stringify(caseRun.result.details, null, 2) }}</pre>
      </div>

      <div v-if="hasMetrics" class="detail-block">
        <span class="detail-label">Metrics</span>
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
          <div v-if="caseRun.result.metrics.correctnessScore != null" class="case-metric">
            <span class="case-metric-label">Score</span>
            <span class="case-metric-value">{{ scoreLabel(caseRun.result) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-case-row {
  border-bottom: 1px solid hsl(from var(--border) h s 10%);
  background: var(--surface);
  overflow: hidden;
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
}

.case-summary:hover {
  background: var(--surface-hover, rgba(255, 255, 255, 0.04));
}

.case-summary.inactive {
  cursor: default;
}

.case-summary.inactive:hover {
  background: none;
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

.test-case-row.passed .status-bar {
  background: #22c55e;
}

.test-case-row.failed .status-bar {
  background: #ef4444;
}

.test-case-row.running .status-bar {
  background: var(--accent);
}

.test-case-row.pending .status-bar {
  background: transparent;
}

.status-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  flex-shrink: 0;
}

.status-icon-wrap.passed {
  color: #22c55e;
}

.status-icon-wrap.failed {
  color: #ef4444;
}

.status-icon-wrap.running {
  color: var(--accent);
}

.status-icon-wrap.pending {
  color: var(--text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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

.test-case-row.pending .case-name,
.test-case-row.running .case-name {
  color: var(--text-secondary);
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

.chevron {
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.chevron.rotated {
  transform: rotate(0deg);
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
}

.error-text {
  color: #ef4444;
}

.detail-pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--surface-elevated);
  padding: 8px 10px;
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
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
}

.message-role {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.message.user .message-role {
  color: var(--accent, #6366f1);
}

.message.assistant .message-role {
  color: #22c55e;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--surface-elevated);
  padding: 8px 10px;
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.case-metrics {
  display: flex;
  gap: 20px;
}

.case-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

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

.outputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.outputs-grid:has(.output-col:only-child) {
  grid-template-columns: 1fr;
}

.output-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.output-pre {
  max-height: 10rem;
  overflow-y: auto;
}
</style>
