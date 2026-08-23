<script setup lang="ts">
import { formatDate } from '@renderer/utils/format'
import { Field, Input, Panel, Textarea } from '@renderer/components/ui'

const name = defineModel<string>('name', { required: true })
const description = defineModel<string | undefined>('description')

const props = defineProps<{
  createdAt: string
  updatedAt: string
}>()
</script>

<template>
  <Panel title="Suite Info">
    <Field label="Name">
      <Input v-model="name" :maxlength="75" />
    </Field>
    <Field label="Description">
      <Textarea v-model="description" :rows="2" />
    </Field>
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
  </Panel>
</template>

<style scoped lang="scss">
.meta-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--border);

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .meta-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    .meta-value {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }
  }
}
</style>
