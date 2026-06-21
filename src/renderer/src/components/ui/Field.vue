<script setup lang="ts">
import InfoTooltip from './InfoTooltip.vue'

defineProps<{
  label: string
  hint?: string
  fill?: boolean
  grow?: boolean
  inline?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field--fill': fill, 'field--grow': grow, 'field--inline': inline }">
    <label class="field--label">
      {{ label }}
      <InfoTooltip v-if="hint" :content="hint" :size="13" placement="right" />
    </label>
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

  &--inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .field--label {
      font-size: var(--text-sm);
      font-weight: 400;
      text-transform: none;
      letter-spacing: normal;
    }
  }

  &--label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    flex-shrink: 0;
  }
}
</style>
