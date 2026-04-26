<script setup lang="ts">
import { formatDate } from '@renderer/utils/format'

const name = defineModel<string>('name', { required: true })
const description = defineModel<string | undefined>('description')

const props = defineProps<{
  createdAt: string
  updatedAt: string
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
        <input v-model="name" class="field-input" />
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea v-model="description" class="field-textarea" rows="3" />
      </div>
      <div class="meta-rows">
        <div class="meta-row">
          <span class="meta-label">Created</span>
          <span class="meta-value">{{ formatDate(props.createdAt, true) }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Updated</span>
          <span class="meta-value">{{ formatDate(props.updatedAt, true) }}</span>
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
  border-left: 2px solid var(--accent-dim);
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
  font-size: var(--text-xs);
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
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--text-sm);
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
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.meta-value {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
</style>
