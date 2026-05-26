<script setup lang="ts">
import { Chevron, CircleProgress } from '@renderer/components/ui'
import { ModelRunTestCaseRow } from '@renderer/components/test-runs'

import type { ModelRef, PerModelRun, TestCaseRun } from '@shared/app/test-run'
import type { TestCase } from '@shared/app/test-suite'
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCloudDownload,
  IconLoader2,
  IconMinus,
  IconX
} from '@tabler/icons-vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  modelRun: PerModelRun
  testCases: TestCase[]
  expanded?: boolean
}>()

const expanded = ref(props.expanded ?? false)

function caseRunFor(testCaseId: string): TestCaseRun | undefined {
  return props.modelRun.caseRuns.find((cr) => cr.testCaseId === testCaseId)
}

const showTestCases = computed<boolean>(() => {
  const s = props.modelRun.status
  return (
    props.modelRun.caseRuns.length > 0 && (s === 'running' || s === 'completed' || s === 'failed')
  )
})

function modelLabel(ref: ModelRef): string {
  const key = ref.source === 'installed' ? ref.modelKey : ref.modelId
  return key.replace(/^(huggingface\.co|hf\.co)\//, '').replace(/:latest$/, '')
}

function duration(mr: PerModelRun): string {
  if (!mr.startedAt || !mr.completedAt) return '—'
  const ms = new Date(mr.completedAt).getTime() - new Date(mr.startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function passRate(mr: PerModelRun): string {
  if (!mr.aggregate) return '—'
  return `${mr.aggregate.passed}/${mr.caseRuns.length}`
}

function score(mr: PerModelRun): string {
  if (mr.aggregate?.avgScore == null) return '—'
  return (mr.aggregate.avgScore * 100).toFixed(0) + '%'
}

function toggle(): void {
  expanded.value = !expanded.value
}

const downloadProgress = computed<number>(() => {
  const { downloadedBytes, totalBytes } = props.modelRun
  if (!downloadedBytes || !totalBytes) return 0
  return Math.min(downloadedBytes / totalBytes, 1)
})

function remainingTime(estimatedCompletion: string): string {
  const estCompletion = new Date(estimatedCompletion).getTime()
  const now = Date.now()
  if (estCompletion <= now || estimatedCompletion.includes('9999')) return '0s'
  const diffMs = estCompletion - now
  const totalSeconds = Math.ceil(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
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
          <IconCloudDownload
            v-else-if="modelRun.status === 'downloading'"
            :size="14"
            :stroke-width="2"
          />
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
        <template v-if="modelRun.status === 'downloading'">
          <span v-if="modelRun.estimatedCompletion" class="download-eta">
            {{ remainingTime(modelRun.estimatedCompletion) }}
          </span>
          <span class="download-progress">
            <CircleProgress :progress="downloadProgress" :size="22" :stroke-width="2" />
          </span>
        </template>
        <span v-else class="stat-duration">{{ duration(modelRun) }}</span>
        <Chevron :expanded="expanded" />
      </div>
    </button>

    <div v-if="expanded" class="row-details">
      <div v-if="modelRun.aggregate && !modelRun.error" class="metrics-grid">
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

      <div v-if="showTestCases" class="test-cases">
        <div class="test-case-list">
          <ModelRunTestCaseRow
            v-for="tc in testCases"
            :key="tc.id"
            :test-case="tc"
            :case-run="caseRunFor(tc.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.model-run-row {
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  overflow: hidden;

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

    &:hover {
      background: var(--surface-hover, rgba(255, 255, 255, 0.04));
    }
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
    color: var(--text-primary);

    &.completed {
      color: var(--green);
    }
    &.failed,
    &.cancelled {
      color: var(--error);
    }
    &.running {
      color: var(--accent);
    }
    &.downloading {
      color: var(--blue);
    }
    &.pending {
      color: var(--text-muted);
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

  .download-eta {
    font-size: var(--text-xs);
    color: var(--text-primary);
    min-width: 36px;
    text-align: right;
  }

  .download-progress {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
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
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 2px;

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
  }

  .error-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: var(--text-xs);
    color: #ef4444;
    line-height: 1.4;
    padding: 0.75rem 0.5rem 0;
  }

  .test-cases,
  .test-case-list {
    display: flex;
    flex-direction: column;
  }
}
</style>
