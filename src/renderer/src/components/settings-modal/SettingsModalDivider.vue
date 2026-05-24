<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="divider">{{ label }}</div>
</template>

<style scoped lang="scss">
.divider {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 0 4px;

  &:first-child {
    padding-top: 0;
  }
}
</style>
