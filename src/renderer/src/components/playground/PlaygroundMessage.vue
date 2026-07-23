<script setup lang="ts">
import { ref } from 'vue'
import {
  IconAlertTriangle,
  IconChevronRight,
  IconCode,
  IconMarkdown,
  IconRefresh
} from '@tabler/icons-vue'
import { Badge, Button, CopyButton, InfoTooltip, MarkdownContent } from '@renderer/components/ui'
import type { PlaygroundMessage } from '@renderer/stores/playground'

defineProps<{
  message: PlaygroundMessage
  canRetry: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const reasoningOpen = ref(false)
const showRaw = ref(false)

function formatStat(value: number, digits = 1): string {
  return value.toFixed(digits)
}
</script>

<template>
  <div class="message" :class="`message--${message.role}`">
    <div v-if="message.role === 'assistant'" class="message__header">
      <Badge type="default" square>
        {{ message.modelName ?? message.role }}
      </Badge>
      <span v-if="message.stats" class="message__stats">
        {{ message.stats.total_output_tokens }} tokens
        <template v-if="message.stats.tokens_per_second > 0">
          · {{ formatStat(message.stats.tokens_per_second) }} tok/s
        </template>
        <template v-if="message.stats.time_to_first_token_seconds > 0">
          · TTFT {{ formatStat(message.stats.time_to_first_token_seconds, 2) }}s
        </template>
        <InfoTooltip placement="right" interactive :size="12">
          <pre class="message__stats-json">{{ JSON.stringify(message.stats, null, 2) }}</pre>
        </InfoTooltip>
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
      <CopyButton v-if="message.reasoning && reasoningOpen" :value="message.reasoning">
        <MarkdownContent
          v-if="!showRaw"
          :content="message.reasoning"
          class="message__reasoning message__reasoning--rendered"
        />
        <pre v-else class="message__reasoning">{{ message.reasoning }}</pre>
      </CopyButton>

      <div class="message__content-wrap">
        <CopyButton :value="message.content">
          <MarkdownContent
            v-if="message.role === 'assistant' && !showRaw"
            :content="message.content"
            class="message__content"
          />
          <div v-else class="message__content message__content--raw">{{ message.content }}</div>
        </CopyButton>
        <button
          v-if="message.role === 'assistant'"
          v-tooltip="showRaw ? 'Show rendered markdown' : 'Show raw text'"
          type="button"
          class="message__raw-toggle"
          @click="showRaw = !showRaw"
        >
          <IconMarkdown v-if="showRaw" :size="13" :stroke-width="2" />
          <IconCode v-else :size="13" :stroke-width="2" />
        </button>
      </div>
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
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  &__stats-json {
    margin: 0;
    font-size: var(--text-xs);
    font-family: var(--font-mono, monospace);
    white-space: pre;
    text-align: left;
    overflow-y: auto;
  }

  &__content-wrap {
    position: relative;

    &:hover .message__raw-toggle {
      opacity: 1;
    }

    &:hover :deep(.copy-btn) {
      opacity: 1;
    }
  }

  &__content {
    padding: 8px 12px;
    font-size: var(--text-sm);
    color: var(--text-primary);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    word-break: break-word;

    &--raw {
      white-space: pre-wrap;
    }
  }

  &__raw-toggle {
    position: absolute;
    top: 6px;
    right: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    color: var(--text-muted);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 6px);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.15s,
      color 0.15s,
      background 0.15s;

    &:hover {
      color: var(--text-primary);
      background: var(--surface-hover, rgba(255, 255, 255, 0.06));
    }
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

    &--rendered {
      font-family: var(--font-body);
      white-space: normal;
    }
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
