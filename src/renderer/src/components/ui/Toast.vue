<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { IconX } from '@tabler/icons-vue'
import type { ToastType } from '@renderer/stores/toast'
import Button from './Button.vue'

const props = defineProps<{
  type: ToastType
  title?: string
  message: string
  duration: number
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const isSticky = computed(() => props.duration <= 0)

let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function startTimer(): void {
  if (isSticky.value) return
  clearTimer()
  timer = setTimeout(() => emit('dismiss'), props.duration)
}

const hovered = ref(false)

function onMouseEnter(): void {
  hovered.value = true
  clearTimer()
}

function onMouseLeave(): void {
  hovered.value = false
  startTimer()
}

onMounted(startTimer)
onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="toast" :class="type" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <div class="toast-content">
      <p v-if="title" class="toast-title">{{ title }}</p>
      <p class="toast-message">{{ message }}</p>
    </div>
    <Button
      type="icon"
      :icon="IconX"
      :icon-stroke-width="2.5"
      class="toast-close"
      @click="emit('dismiss')"
    />
  </div>
</template>

<style scoped lang="scss">
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 50vw;
  padding: 6px 6px 6px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius-lg);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;

  &.success {
    border-left-color: var(--green);
    .toast-icon {
      color: var(--green);
    }
  }

  &.error {
    border-left-color: var(--error);
    .toast-icon {
      color: var(--error);
    }
  }

  &.info {
    border-left-color: var(--blue);
    .toast-icon {
      color: var(--blue);
    }
  }

  &.warning {
    border-left-color: var(--accent);
    .toast-icon {
      color: var(--accent);
    }
  }

  &.default {
    border-left-color: var(--border-strong);
    .toast-icon {
      color: var(--text-secondary);
    }
  }
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-content {
  flex: 1;
  min-width: 0;
  max-height: 6rem;
  overflow: auto;
}

.toast-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
}
</style>
