<script setup lang="ts">
import { formatDate } from '@renderer/utils/format'
import BaseField from '@renderer/components/base/BaseField.vue'
import BasePanel from '@renderer/components/base/BasePanel.vue'

const name = defineModel<string>('name', { required: true })
const description = defineModel<string | undefined>('description')

const props = defineProps<{
  createdAt: string
  updatedAt: string
}>()
</script>

<template>
  <BasePanel title="Suite Info">
    <BaseField label="Name">
      <input v-model="name" class="field-input" />
    </BaseField>
    <BaseField label="Description">
      <textarea v-model="description" class="field-textarea" rows="3" />
    </BaseField>
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
  </BasePanel>
</template>

<style scoped>
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
