<script setup lang="ts">
import type { TestSuite } from '@shared/app/test-suite'

defineProps<{
  suite: TestSuite
}>()
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Suite Info</span>
    </div>
    <div class="panel-body">
      <div class="field">
        <label class="field-label">Name</label>
        <input class="field-input" :value="suite.name" />
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea class="field-textarea" :value="suite.description" rows="3" />
      </div>
      <div class="field">
        <label class="field-label">Version</label>
        <input class="field-input" :value="suite.version" />
      </div>
      <div class="meta-rows">
        <div class="meta-row">
          <span class="meta-label">Created</span>
          <span class="meta-value">{{ new Date(suite.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Updated</span>
          <span class="meta-value">{{ new Date(suite.updatedAt).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-border);
  background: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 3rem;
}

.panel-title {
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.panel-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 0.82rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  resize: none;
  transition: border-color 0.15s;
  line-height: 1.5;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--accent-border);
}

.meta-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--border);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.meta-value {
  font-size: 0.72rem;
  color: var(--text-secondary);
}
</style>
