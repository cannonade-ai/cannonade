<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconAlertCircle, IconPlayerStop } from '@tabler/icons-vue'
import type { TestRun, PerModelRun, ModelRef } from '@shared/app/test-run'
import BaseBadge from '@renderer/components/BaseBadge.vue'
import BaseButton from '@renderer/components/BaseButton.vue'
import BaseModal from '@renderer/components/BaseModal.vue'
import { useTestRunsStore } from '@renderer/stores/test-runs'

const props = defineProps<{
  run: TestRun
}>()

const store = useTestRunsStore()
const showCancelModal = ref(false)

const isActive = computed(() => props.run.status === 'running' || props.run.status === 'pending')

function confirmCancel(): void {
  store.cancelRun(props.run.id)
  showCancelModal.value = false
}

function modelLabel(ref: ModelRef): string {
  return ref.source === 'installed' ? ref.modelKey : ref.modelId
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
        <base-badge :status="run.status">{{ run.status }}</base-badge>
      </div>
      <div class="header-meta">
        <span class="meta-tag">{{
          run.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'
        }}</span>
        <span v-if="run.config.parallelRun" class="meta-tag">Parallel</span>
        <span class="meta-date">{{ formatDate(run.createdAt) }}</span>
      </div>
    </div>

    <div v-if="isActive" class="panel-toolbar">
      <base-button type="danger-outline" :icon="IconPlayerStop" @click="showCancelModal = true">
        Stop Run
      </base-button>
    </div>

    <base-modal v-model="showCancelModal" title="Stop Run">
      Are you sure you want to stop this run? Any in-progress model evaluations will be cancelled.
      <template #actions="{ close }">
        <base-button @click="close">Cancel</base-button>
        <base-button type="danger-outline" @click="confirmCancel">Stop Run</base-button>
      </template>
    </base-modal>

    <div class="panel-body">
      <div class="section-label">Model Results</div>
      <div class="model-cards">
        <div v-for="mr in run.modelRuns" :key="mr.id" class="model-card" :class="mr.status">
          <div class="model-card-header">
            <div class="model-name-row">
              <base-badge :status="mr.status" />
              <span class="model-name">{{ modelLabel(mr.modelRef) }}</span>
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
            <template v-if="mr.aggregate.avgTokensPerSecond != null">
              <div class="metric-divider" />
              <div class="metric">
                <span class="metric-label">Tok/s (avg)</span>
                <span class="metric-value">{{ mr.aggregate.avgTokensPerSecond.toFixed(1) }}</span>
              </div>
              <div v-if="mr.aggregate.minTokensPerSecond != null" class="metric">
                <span class="metric-label">Tok/s (min)</span>
                <span class="metric-value">{{ mr.aggregate.minTokensPerSecond.toFixed(1) }}</span>
              </div>
              <div v-if="mr.aggregate.maxTokensPerSecond != null" class="metric">
                <span class="metric-label">Tok/s (max)</span>
                <span class="metric-value">{{ mr.aggregate.maxTokensPerSecond.toFixed(1) }}</span>
              </div>
            </template>
            <template v-if="mr.aggregate.avgTimeToFirstTokenMs != null">
              <div class="metric-divider" />
              <div class="metric">
                <span class="metric-label">TTFT (avg)</span>
                <span class="metric-value"
                  >{{ mr.aggregate.avgTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
              <div v-if="mr.aggregate.minTimeToFirstTokenMs != null" class="metric">
                <span class="metric-label">TTFT (min)</span>
                <span class="metric-value"
                  >{{ mr.aggregate.minTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
              <div v-if="mr.aggregate.maxTimeToFirstTokenMs != null" class="metric">
                <span class="metric-label">TTFT (max)</span>
                <span class="metric-value"
                  >{{ mr.aggregate.maxTimeToFirstTokenMs.toFixed(0) }}ms</span
                >
              </div>
            </template>
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
  height: 3rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: var(--text-sm);
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
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 7px;
  background: var(--surface-elevated);
  color: var(--text-muted);
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.meta-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
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
  font-size: var(--text-xs);
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

.model-status-icon.completed {
  color: #22c55e;
}
.model-status-icon.failed {
  color: #ef4444;
}
.model-status-icon.running {
  color: var(--accent);
}
.model-status-icon.pending,
.model-status-icon.cancelled {
  color: var(--text-muted);
}

.model-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.duration {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

.metrics-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.metric-divider {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  flex-shrink: 0;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: var(--text-xs);
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
</style>
