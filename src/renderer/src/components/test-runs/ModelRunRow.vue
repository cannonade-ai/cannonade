<script setup lang="ts">
import { ref } from 'vue'
import {
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
  IconMinus,
  IconChevronDown,
  IconAlertCircle
} from '@tabler/icons-vue'
import type { PerModelRun, ModelRef } from '@shared/app/test-run'
import type { TestCase } from '@shared/app/test-suite'
import ModelRunTestCaseRow from './ModelRunTestCaseRow.vue'

defineProps<{
  modelRun: PerModelRun
  testCases: TestCase[]
}>()

const expanded = ref(false)

function modelLabel(ref: ModelRef): string {
  return ref.source === 'installed' ? ref.modelKey : ref.modelId
}

function duration(mr: PerModelRun): string {
  if (!mr.startedAt || !mr.completedAt) return '—'
  const ms = new Date(mr.completedAt).getTime() - new Date(mr.startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function passRate(mr: PerModelRun): string {
  if (!mr.aggregate) return '—'
  return `${mr.aggregate.passed}/${mr.aggregate.total}`
}

function score(mr: PerModelRun): string {
  if (mr.aggregate?.avgCorrectnessScore == null) return '—'
  return (mr.aggregate.avgCorrectnessScore * 100).toFixed(0) + '%'
}

function toggle(): void {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="model-run-row" :class="modelRun.status">
    <button class="row-summary" @click="toggle">
      <div class="summary-left">
        <span class="status-icon" :class="modelRun.status">
          <IconCheck v-if="modelRun.status === 'completed'" :size="14" :stroke-width="2.5" />
          <IconX
            v-else-if="modelRun.status === 'failed' || modelRun.status === 'cancelled'"
            :size="14"
            :stroke-width="2.5"
          />
          <IconLoader2
            v-else-if="modelRun.status === 'running'"
            :size="14"
            :stroke-width="2"
            class="spin"
          />
          <IconClock v-else-if="modelRun.status === 'pending'" :size="14" :stroke-width="2" />
          <IconMinus v-else :size="14" :stroke-width="2" />
        </span>
        <span class="model-name">{{ modelLabel(modelRun.modelRef) }}</span>

        <span class="summary-stat">
          <span class="stat-label">Pass</span>
          <span class="stat-value">{{ passRate(modelRun) }}</span>
        </span>
        <span class="summary-stat">
          <span class="stat-label">Score</span>
          <span class="stat-value">{{ score(modelRun) }}</span>
        </span>
      </div>

      <div class="summary-right">
        <span class="stat-duration">{{ duration(modelRun) }}</span>
        <IconChevronDown
          :size="14"
          :stroke-width="2"
          class="chevron"
          :class="{ rotated: expanded }"
        />
      </div>
    </button>

    <div v-if="expanded" class="row-details">
      <div v-if="modelRun.aggregate" class="metrics-grid">
        <template v-if="modelRun.aggregate.avgTokensPerSecond != null">
          <div class="metric-group">
            <span class="group-label">Tokens/s</span>
            <div class="group-values">
              <div class="metric">
                <span class="metric-label">Avg</span>
                <span class="metric-value">{{
                  modelRun.aggregate.avgTokensPerSecond.toFixed(1)
                }}</span>
              </div>
              <div v-if="modelRun.aggregate.minTokensPerSecond != null" class="metric">
                <span class="metric-label">Min</span>
                <span class="metric-value">{{
                  modelRun.aggregate.minTokensPerSecond.toFixed(1)
                }}</span>
              </div>
              <div v-if="modelRun.aggregate.maxTokensPerSecond != null" class="metric">
                <span class="metric-label">Max</span>
                <span class="metric-value">{{
                  modelRun.aggregate.maxTokensPerSecond.toFixed(1)
                }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-if="modelRun.aggregate.avgTimeToFirstTokenMs != null">
          <div class="metric-group-divider" />
          <div class="metric-group">
            <span class="group-label">Time To First Token</span>
            <div class="group-values">
              <div class="metric">
                <span class="metric-label">Avg</span>
                <span class="metric-value"
                  >{{ modelRun.aggregate.avgTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
              <div v-if="modelRun.aggregate.minTimeToFirstTokenMs != null" class="metric">
                <span class="metric-label">Min</span>
                <span class="metric-value"
                  >{{ modelRun.aggregate.minTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
              <div v-if="modelRun.aggregate.maxTimeToFirstTokenMs != null" class="metric">
                <span class="metric-label">Max</span>
                <span class="metric-value"
                  >{{ modelRun.aggregate.maxTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-if="modelRun.error" class="error-row">
        <IconAlertCircle :size="13" :stroke-width="2" />
        {{ modelRun.error }}
      </div>

      <div v-if="modelRun.results.length > 0" class="test-cases">
        <div class="test-case-list">
          <model-run-test-case-row
            v-for="result in modelRun.results"
            :key="result.testCaseId"
            :result="result"
            :test-case="testCases.find((tc) => tc.id === result.testCaseId)!"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-run-row {
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  overflow: hidden;
}

.row-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  height: 3.5rem;
}

.row-summary:hover {
  background: var(--surface-hover, rgba(255, 255, 255, 0.04));
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.status-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.status-icon.completed {
  color: #22c55e;
}
.status-icon.failed,
.status-icon.cancelled {
  color: #ef4444;
}
.status-icon.running {
  color: var(--accent);
}
.status-icon.pending {
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

.model-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 1rem;
}

.summary-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-value {
  font-size: var(--text-sm);
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
  line-height: 1;
}

.stat-duration {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}

.chevron {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.chevron.rotated {
  transform: rotate(0deg);
}

.row-details {
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metrics-grid {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
}

.metric-group-divider {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  flex-shrink: 0;
}

.metric-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.group-values {
  display: flex;
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.metric-value {
  font-size: var(--text-base);
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.error-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--text-xs);
  color: #ef4444;
  line-height: 1.4;
}

.test-cases {
  display: flex;
  flex-direction: column;
}

.test-case-list {
  display: flex;
  flex-direction: column;
}
</style>
