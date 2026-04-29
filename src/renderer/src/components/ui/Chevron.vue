<script setup lang="ts">
import { IconChevronDown } from '@tabler/icons-vue'

withDefaults(
  defineProps<{
    expanded: boolean
    size?: number
  }>(),
  {
    size: 14
  }
)
</script>

<template>
  <IconChevronDown :size="size" :stroke-width="2" class="chevron" :class="{ rotated: expanded }" />
</template>

<style scoped lang="scss">
.chevron {
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);

  &.rotated {
    transform: rotate(0deg);
  }
}
</style>
