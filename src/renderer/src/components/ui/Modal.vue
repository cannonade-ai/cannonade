<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg'
    closeOnBackdrop?: boolean
  }>(),
  {
    size: 'sm',
    closeOnBackdrop: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close(): void {
  emit('update:modelValue', false)
}

function onBackdropClick(): void {
  if (props.closeOnBackdrop) close()
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.modelValue) close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="onBackdropClick">
        <div class="modal-panel" :class="`modal-panel--${size}`" role="dialog" aria-modal="true">
          <div v-if="title" class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.actions" class="modal-actions">
            <slot name="actions" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.modal-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &--sm {
    width: 360px;
    max-width: calc(100vw - 2rem);
  }

  &--md {
    width: 560px;
    max-width: calc(100vw - 2rem);
  }

  &--lg {
    width: 800px;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 4rem);

    .modal-body {
      flex: 1;
    }
  }
}

.modal-header {
  padding: 20px 24px 0;
}

.modal-title {
  font-family: var(--font-headline);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 24px 20px;
}

.modal {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.18s var(--ease-out);

    .modal-panel {
      transition:
        opacity 0.18s var(--ease-out),
        transform 0.18s var(--ease-out);
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .modal-panel {
      opacity: 0;
      transform: scale(0.95) translateY(-8px);
    }
  }
}
</style>
