<script setup lang="ts">
import { TooltipPlacement } from '@renderer/utils/tooltip.js'
import InfoTooltip from './InfoTooltip.vue'

defineProps<{
  label: string
  hint?: string
  hintPlacement?: TooltipPlacement
  fill?: boolean
  grow?: boolean
  inline?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field--fill': fill, 'field--grow': grow, 'field--inline': inline }">
    <label class="field--label">
      {{ label }}
      <InfoTooltip v-if="hint" :content="hint" :size="13" :placement="hintPlacement ?? 'right'" />
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
    min-width: 0;
  }

  &--inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .field--label {
      font-size: var(--text-sm);
    }
  }

  &--label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-sm);
    color: var(--text-muted);
    flex-shrink: 0;
  }
}
</style>
