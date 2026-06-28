<script setup lang="ts">
import { useToastStore } from '@renderer/stores/toast'
import Toast from './Toast.vue'

const store = useToastStore()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="toast" class="toast-container">
      <Toast
        v-for="toast in store.toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        @dismiss="store.dismiss(toast.id)"
      />
    </TransitionGroup>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  top: 3rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

.toast {
  transition:
    opacity 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-24px);
  }
}
</style>
