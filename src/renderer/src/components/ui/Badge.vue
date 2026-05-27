<script setup lang="ts">
import {
  Icon,
  IconCircleCheck,
  IconCircleMinus,
  IconCircleX,
  IconClock,
  IconCloudDownload,
  IconLoader2,
  IconX
} from '@tabler/icons-vue'
import { computed } from 'vue'

export type BadgeType = 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'info'
export type Status = 'pending' | 'downloading' | 'running' | 'completed' | 'failed' | 'cancelled'
export type IconAnimation = 'spin' | 'pulse' | 'bounce'

const props = defineProps<{
  type?: BadgeType
  status?: Status
  icon?: Icon
  iconAnimation?: IconAnimation
  square?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const statusBadgeTypeMap: Record<Status, BadgeType> = {
  completed: 'success',
  failed: 'danger',
  running: 'secondary',
  downloading: 'info',
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
  downloading: IconCloudDownload,
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
  if (props.status === 'downloading') return 'pulse'
  if (props.status === 'pending') return 'pulse'
  return null
})
</script>

<template>
  <span class="badge" :class="[computedType, { square }]">
    <component
      :is="computedIcon"
      v-if="computedIcon"
      :size="11"
      :stroke-width="2.5"
      :class="computedIconAnimation"
    />
    <slot />
    <button v-if="removable" class="badge-remove" @click.stop="emit('remove')">
      <IconX :size="10" :stroke-width="2.5" />
    </button>
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

  &.square {
    border-radius: 2px;
  }
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
    background: var(--accent-bg);
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

  &.info {
    background: var(--blue-dim);
    color: var(--blue);
  }
}

.badge-remove {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
}
</style>
