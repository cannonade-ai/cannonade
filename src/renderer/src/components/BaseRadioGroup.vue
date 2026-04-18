<script setup lang="ts" generic="T extends string">
defineProps<{
  options: { value: T; label: string }[]
  type?: 'rounded'
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="radio-group">
    <label
      v-for="(option, index) in options"
      :key="option.value"
      class="radio-option"
      :class="{
        active: model === option.value,
        'rounded-first': type === 'rounded' && index === 0,
        'rounded-last': type === 'rounded' && index === options.length - 1
      }"
    >
      <input v-model="model" type="radio" :value="option.value" />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped>
.radio-group {
  display: flex;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}

.radio-option input {
  display: none;
}

.radio-option.rounded-first {
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

.radio-option.rounded-last {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.radio-option.active {
  background: var(--accent-dim);
  border-color: var(--accent-border);
  color: var(--accent);
}
</style>
