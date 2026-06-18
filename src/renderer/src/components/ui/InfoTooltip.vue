<script setup lang="ts">
import { IconInfoCircle } from '@tabler/icons-vue'

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

withDefaults(
  defineProps<{
    content: string
    placement?: TooltipPlacement
    size?: number
    delay?: number
  }>(),
  {
    placement: 'top',
    size: 14,
    delay: 100
  }
)
</script>

<template>
  <span v-tooltip="{ content, placement, delay }" class="info-tooltip" tabindex="0">
    <IconInfoCircle :size="size" :stroke-width="2" />
  </span>
</template>

<style scoped lang="scss">
.info-tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: help;
  border-radius: var(--radius-full);
  outline: none;
  transition: color 0.12s;

  &:hover,
  &:focus-visible {
    color: var(--text-secondary);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-border);
  }
}
</style>
