<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  size?: number
  strokeWidth?: number
}>()

const size = computed(() => props.size ?? 22)
const strokeWidth = computed(() => props.strokeWidth ?? 2)
const radius = computed(() => (size.value - strokeWidth.value * 2) / 2)
const center = computed(() => size.value / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - Math.min(Math.max(props.progress, 0), 1)))
</script>

<template>
  <svg :width="size" :height="size" class="circle-progress">
    <circle
      class="track"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
    />
    <circle
      class="fill"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
    />
  </svg>
</template>

<style scoped lang="scss">
.circle-progress {
  transform: rotate(-90deg);
  flex-shrink: 0;

  .track {
    stroke: var(--border);
  }

  .fill {
    stroke: var(--blue);
    transition: stroke-dashoffset 0.4s ease;
  }
}
</style>
