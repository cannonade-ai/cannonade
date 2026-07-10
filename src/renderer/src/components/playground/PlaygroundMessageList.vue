<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { IconLoader2, IconMessageCircle } from '@tabler/icons-vue'
import PlaygroundMessage from './PlaygroundMessage.vue'
import type { PlaygroundMessage as PlaygroundMessageModel } from '@renderer/stores/playground'

const props = defineProps<{
  messages: PlaygroundMessageModel[]
  sending: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const viewport = ref<HTMLElement | null>(null)

watch(
  () => [props.messages.length, props.sending],
  async () => {
    await nextTick()
    viewport.value?.scrollTo({ top: viewport.value.scrollHeight })
  }
)

function isLast(index: number): boolean {
  return index === props.messages.length - 1
}
</script>

<template>
  <div ref="viewport" class="message-list">
    <div v-if="messages.length === 0 && !sending" class="message-list__empty">
      <IconMessageCircle :size="32" :stroke-width="1.5" />
      <p>Send a message to start a conversation.</p>
    </div>

    <template v-else>
      <PlaygroundMessage
        v-for="(message, i) in messages"
        :key="message.id"
        :message="message"
        :can-retry="isLast(i) && !sending"
        @retry="emit('retry')"
      />
      <div v-if="sending" class="message-list__generating">
        <IconLoader2 :size="14" class="spin" />
        Generating…
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  overflow-y: auto;
  padding: 4px 2px;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  &__generating {
    display: flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}
</style>
