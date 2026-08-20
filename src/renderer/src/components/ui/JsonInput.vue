<script setup lang="ts">
import { ref, watch } from 'vue'
import Textarea from './Textarea.vue'

const model = defineModel<Record<string, unknown> | undefined>()

withDefaults(defineProps<{ placeholder?: string; rows?: number }>(), { rows: 6 })

function serialize(value: Record<string, unknown> | undefined): string {
  if (!value || Object.keys(value).length === 0) return ''
  return JSON.stringify(value, null, 2)
}

const text = ref<string | undefined>(serialize(model.value))
const error = ref<string | null>(null)

let lastEmitted = model.value

watch(text, (value) => {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    error.value = null
    lastEmitted = undefined
    model.value = undefined
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Invalid JSON'
    return
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    error.value = 'Must be a JSON object'
    return
  }

  error.value = null
  lastEmitted = parsed as Record<string, unknown>
  model.value = lastEmitted
})

watch(model, (value) => {
  if (value === lastEmitted) return
  lastEmitted = value
  error.value = null
  text.value = serialize(value)
})
</script>

<template>
  <div class="json-input">
    <Textarea v-model="text" :rows="rows" :placeholder="placeholder" :error="!!error" />
    <p v-if="error" class="json-input__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.json-input {
  display: flex;
  flex-direction: column;
  gap: 4px;

  :deep(.textarea) {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
  }
}

.json-input__error {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--error);
}
</style>
