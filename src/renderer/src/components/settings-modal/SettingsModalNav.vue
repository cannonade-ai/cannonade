<script setup lang="ts">
defineProps<{
  sections: { id: string; label: string; icon: unknown }[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [id: string]
}>()
</script>

<template>
  <nav class="settings-nav">
    <button
      v-for="section in sections"
      :key="section.id"
      class="settings-nav-item"
      :class="{ active: modelValue === section.id }"
      @click="$emit('update:modelValue', section.id)"
    >
      <component :is="section.icon" :size="15" :stroke-width="1.75" />
      {{ section.label }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.settings-nav {
  display: flex;
  flex-direction: column;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &.active {
    background: var(--surface-elevated);
    border-left-color: var(--accent);
    color: var(--text-primary);
  }
}
</style>
