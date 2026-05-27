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
      class="option"
      :class="{
        active: model === option.value,
        'rounded-first': index === 0,
        'rounded-last': index === options.length - 1
      }"
    >
      <input v-model="model" type="radio" :value="option.value" />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped lang="scss">
.radio-group {
  display: flex;

  .option {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    cursor: pointer;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;

    input {
      display: none;
    }

    &.rounded-first {
      border-radius: var(--radius) 0 0 var(--radius);
    }

    &.rounded-last {
      border-radius: 0 var(--radius) var(--radius) 0;
    }

    &.active {
      background: var(--accent-bg);
      border-color: var(--accent-border);
      color: var(--accent);
    }
  }
}
</style>
