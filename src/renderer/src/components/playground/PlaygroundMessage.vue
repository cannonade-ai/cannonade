<script setup lang="ts">
import { ref } from 'vue'
import { IconAlertTriangle, IconChevronRight, IconRefresh } from '@tabler/icons-vue'
import { Badge, Button, CopyButton } from '@renderer/components/ui'
import type { PlaygroundMessage } from '@renderer/stores/playground'

defineProps<{
  message: PlaygroundMessage
  canRetry: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const reasoningOpen = ref(false)

function formatStat(value: number, digits = 1): string {
  return value.toFixed(digits)
}
</script>

<template>
  <div class="message" :class="`message--${message.role}`">
    <div class="message__header">
      <Badge :type="message.role === 'user' ? 'secondary' : 'default'" square>
        {{ message.role }}
      </Badge>
      <span v-if="message.stats" class="message__stats">
        {{ message.stats.total_output_tokens }} tokens
        <template v-if="message.stats.tokens_per_second > 0">
          · {{ formatStat(message.stats.tokens_per_second) }} tok/s
        </template>
        <template v-if="message.stats.time_to_first_token_seconds > 0">
          · TTFT {{ formatStat(message.stats.time_to_first_token_seconds, 2) }}s
        </template>
      </span>
    </div>

    <div v-if="message.error" class="message__error">
      <IconAlertTriangle :size="14" />
      <span class="message__error-text">{{ message.error }}</span>
      <Button v-if="canRetry" v-tooltip="'Retry'" type="icon" @click="emit('retry')">
        <IconRefresh :size="14" />
      </Button>
    </div>

    <template v-else>
      <button
        v-if="message.reasoning"
        class="message__reasoning-toggle"
        @click="reasoningOpen = !reasoningOpen"
      >
        <IconChevronRight :size="12" class="chevron" :class="{ open: reasoningOpen }" />
        Reasoning
      </button>
      <pre v-if="message.reasoning && reasoningOpen" class="message__reasoning">{{
        message.reasoning
      }}</pre>

      <CopyButton :value="message.content">
        <div class="message__content">{{ message.content }}</div>
      </CopyButton>
    </template>
  </div>
</template>

<style scoped lang="scss">
.message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 85%;

  &--user {
    align-self: flex-end;

    .message__header {
      justify-content: flex-end;
    }

    .message__content {
      background: var(--accent-bg);
      border-color: var(--accent-border);
    }
  }

  &--assistant {
    align-self: flex-start;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__stats {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  &__content {
    padding: 8px 12px;
    font-size: var(--text-sm);
    color: var(--text-primary);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__reasoning-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    padding: 0;
    font-size: var(--text-xs);
    font-family: var(--font-body);
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: var(--text-secondary);
    }

    .chevron {
      transition: transform 0.15s;

      &.open {
        transform: rotate(90deg);
      }
    }
  }

  &__reasoning {
    margin: 0;
    padding: 8px 12px;
    font-size: var(--text-xs);
    font-family: var(--font-mono, monospace);
    color: var(--text-secondary);
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: var(--text-sm);
    color: var(--error);
    background: color-mix(in srgb, var(--error) 8%, transparent);
    border: 1px solid var(--error);
    border-radius: var(--radius-lg);
  }

  &__error-text {
    flex: 1;
    word-break: break-word;
  }
}
</style>
