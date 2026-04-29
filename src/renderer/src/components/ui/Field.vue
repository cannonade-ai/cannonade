<script setup lang="ts">
defineProps<{
  label: string
  fill?: boolean
  grow?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field--fill': fill, 'field--grow': grow }">
    <label class="field--label">{{ label }}</label>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--fill {
    flex: 1;
    overflow: hidden;
  }

  &--grow {
    flex: 1;
  }

  &--label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    flex-shrink: 0;
  }
}
</style>
