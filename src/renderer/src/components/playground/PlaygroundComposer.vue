<script setup lang="ts">
import { ref } from 'vue'
import { IconPlayerStop, IconSend } from '@tabler/icons-vue'
import { Button, Textarea } from '@renderer/components/ui'

const props = defineProps<{
  sending: boolean
  canSend: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  stop: []
}>()

const draft = ref<string | undefined>('')

function submit(): void {
  const text = draft.value?.trim()
  if (!text || !props.canSend) return
  emit('send', text)
  draft.value = ''
}

function onEnter(e: KeyboardEvent): void {
  if (e.shiftKey) return
  e.preventDefault()
  submit()
}
</script>

<template>
  <div class="composer">
    <Textarea
      v-model="draft"
      class="composer__input"
      placeholder="Type a message… (Enter to send, Shift+Enter for a new line)"
      :rows="3"
      :disabled="sending"
      @keydown.enter="onEnter"
    />
    <Button
      v-if="sending"
      v-tooltip="'Stop generating'"
      type="danger-outline"
      :icon="IconPlayerStop"
      @click="emit('stop')"
    >
      Stop
    </Button>
    <Button
      v-else
      type="primary"
      :icon="IconSend"
      :disabled="!canSend || !draft?.trim()"
      @click="submit"
    >
      Send
    </Button>
  </div>
</template>

<style scoped lang="scss">
.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;

  &__input {
    flex: 1;
  }
}
</style>
