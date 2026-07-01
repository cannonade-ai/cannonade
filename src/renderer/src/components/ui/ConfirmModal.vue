<script setup lang="ts">
import { computed } from 'vue'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useShortcut } from '@renderer/composables/useShortcut'
import Modal from './Modal.vue'
import Button from './Button.vue'

const store = useConfirmStore()

const visible = computed({
  get: () => store.current !== null,
  set: (v) => {
    if (!v) store.respond(false)
  }
})

useShortcut(['Enter', 'Ctrl+Enter'], () => {
  if (store.current !== null) store.respond(true)
})
</script>

<template>
  <Modal v-model="visible" :title="store.current?.title ?? 'Confirm'" :close-on-backdrop="false">
    {{ store.current?.message }}
    <template #actions="{ close }">
      <Button @click="close">{{ store.current?.cancelText ?? 'Cancel' }}</Button>
      <Button :type="store.current?.danger ? 'danger' : 'primary'" @click="store.respond(true)">
        {{ store.current?.confirmText ?? 'Confirm' }}
      </Button>
    </template>
  </Modal>
</template>
