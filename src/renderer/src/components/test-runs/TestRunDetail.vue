<script setup lang="ts">
import {
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconClock,
  IconCircleMinus,
  IconAlertCircle,
} from '@tabler/icons-vue'
import type { TestRun, PerModelRun, RunStatus, ModelRef } from '@shared/app/test-run'

defineProps<{
  run: TestRun
}>()

const statusIconMap: Record<RunStatus, unknown> = {
  completed: IconCircleCheck,
  failed: IconCircleX,
  running: IconLoader2,
  pending: IconClock,
  cancelled: IconCircleMinus,
}

function statusIcon(status: RunStatus) {
  return statusIconMap[status]
}

function modelLabel(ref: ModelRef): string {
  return ref.source === 'installed' ? ref.modelKey : ref.modelId
}

function modelSource(ref: ModelRef): string {
  return ref.source === 'huggingface' ? 'HuggingFace' : 'Installed'
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function duration(run: PerModelRun | TestRun): string {
  if (!('startedAt' in run) || !run.startedAt || !run.completedAt) return '—'
  const ms = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function passRate(run: PerModelRun): string {
  if (!run.aggregate) return '—'
  const { passed, total } = run.aggregate
  return `${passed}/${total}`
}

function score(run: PerModelRun): string {
  if (run.aggregate?.avgCorrectnessScore == null) return '—'
  return (run.aggregate.avgCorrectnessScore * 100).toFixed(0) + '%'
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-title">{{ run.suiteName }}</span>
        <span class="status-badge" :class="run.status">
          <component :is="statusIcon(run.status)" :size="11" :stroke-width="2.5" />
          {{ run.status }}
        </span>
      </div>
      <div class="header-meta">
        <span class="meta-tag">{{ run.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter' }}</span>
        <span v-if="run.config.parallelRun" class="meta-tag">Parallel</span>
        <span class="meta-date">{{ formatDate(run.createdAt) }}</span>
      </div>
    </div>

    <div class="panel-body">
      <div class="section-label">Model Results</div>
      <div class="model-cards">
        <div
          v-for="mr in run.modelRuns"
          :key="mr.id"
          class="model-card"
          :class="mr.status"
        >
          <div class="model-card-header">
            <div class="model-name-row">
              <component :is="statusIcon(mr.status)" :size="14" :stroke-width="2.5" class="model-status-icon" :class="mr.status" />
              <span class="model-name">{{ modelLabel(mr.modelRef) }}</span>
              <span class="model-source-badge">{{ modelSource(mr.modelRef) }}</span>
            </div>
            <span class="duration">{{ duration(mr) }}</span>
          </div>

          <div v-if="mr.aggregate" class="metrics-row">
            <div class="metric">
              <span class="metric-label">Pass / Fail</span>
              <span class="metric-value">{{ passRate(mr) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Score</span>
              <span class="metric-value">{{ score(mr) }}</span>
            </div>
            <div v-if="mr.aggregate.avgTokensPerSecond != null" class="metric">
              <span class="metric-label">Tok/s</span>
              <span class="metric-value">{{ mr.aggregate.avgTokensPerSecond?.toFixed(1) }}</span>
            </div>
            <div v-if="mr.aggregate.avgTimeToFirstTokenMs != null" class="metric">
              <span class="metric-label">TTFT</span>
              <span class="metric-value">{{ mr.aggregate.avgTimeToFirstTokenMs }}ms</span>
            </div>
          </div>

          <div v-if="mr.error" class="error-row">
            <IconAlertCircle :size="13" :stroke-width="2" />
            {{ mr.error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-tag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 7px;
  background: var(--surface-elevated);
  color: var(--text-muted);
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.meta-date {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  font-family: var(--font-headline);
}

.model-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-card {
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.model-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.model-status-icon {
  flex-shrink: 0;
}

.model-status-icon.completed { color: #22c55e; }
.model-status-icon.failed { color: #ef4444; }
.model-status-icon.running { color: var(--accent); }
.model-status-icon.pending,
.model-status-icon.cancelled { color: var(--text-muted); }

.model-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-source-badge {
  font-size: 0.64rem;
  font-weight: 600;
  padding: 1px 6px;
  background: var(--surface);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.duration {
  font-size: 0.74rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.metrics-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.64rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.metric-value {
  font-size: 0.9rem;
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.error-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.78rem;
  color: #ef4444;
  line-height: 1.4;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-size: 0.66rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.status-badge.completed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.status-badge.failed { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.status-badge.running { background: var(--accent-dim); color: var(--accent); }
.status-badge.pending,
.status-badge.cancelled { background: var(--surface-elevated); color: var(--text-muted); }
</style>
