<script setup lang="ts">
import {
  Icon,
  IconCircleCheck,
  IconCircleMinus,
  IconCircleX,
  IconClock,
  IconLoader2
} from '@tabler/icons-vue'
import { computed } from 'vue'

export type BadgeType = 'default' | 'primary' | 'secondary' | 'danger' | 'success'
export type Status = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type IconAnimation = 'spin' | 'pulse' | 'bounce'

const props = defineProps<{
  type?: BadgeType
  status?: Status
  icon?: Icon
  iconAnimation?: IconAnimation
}>()

const statusBadgeTypeMap: Record<Status, BadgeType> = {
  completed: 'success',
  failed: 'danger',
  running: 'secondary',
  pending: 'default',
  cancelled: 'default'
}

function statusBadgeType(status: Status): BadgeType {
  return statusBadgeTypeMap[status]
}

const statusIconMap: Record<Status, Icon> = {
  completed: IconCircleCheck,
  failed: IconCircleX,
  running: IconLoader2,
  pending: IconClock,
  cancelled: IconCircleMinus
}

function statusIcon(status: Status): Icon {
  return statusIconMap[status]
}

const computedType = computed(() => {
  if (props.type) return props.type
  if (props.status) return statusBadgeType(props.status)
  return 'default'
})

const computedIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.status) return statusIcon(props.status)
  return null
})

const computedIconAnimation = computed(() => {
  if (props.iconAnimation) return props.iconAnimation
  if (props.status === 'running') return 'spin'
  if (props.status === 'pending') return 'pulse'
  return null
})
</script>

<template>
  <span class="badge" :class="computedType">
    <component
      :is="computedIcon"
      v-if="computedIcon"
      :size="11"
      :stroke-width="2.5"
      :class="computedIconAnimation"
    />
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  min-height: 1.375rem;
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: capitalize;

  &.default {
    background: var(--surface-elevated);
    color: var(--text-muted);
  }

  &.primary {
    background: var(--accent);
    color: var(--surface);
  }

  &.secondary {
    background: var(--accent-dim);
    color: var(--accent);
  }

  &.success {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
}
</style>
