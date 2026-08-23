<script setup lang="ts">
import { IconExternalLink } from '@tabler/icons-vue'

export type ExternalLinkColor = 'accent' | 'muted'

withDefaults(
  defineProps<{
    href: string
    color?: ExternalLinkColor
    icon?: boolean
    iconSize?: number
  }>(),
  {
    color: 'accent',
    icon: true,
    iconSize: 14
  }
)
</script>

<template>
  <a
    class="external-link"
    :class="`external-link--${color}`"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot />
    <IconExternalLink v-if="icon" :size="iconSize" :stroke-width="2" class="external-link-icon" />
  </a>
</template>

<style scoped lang="scss">
.external-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: normal;
  text-decoration: underline;
  transition: color 0.15s ease;

  &:hover {
    text-decoration: underline;
  }

  &--accent {
    color: var(--accent);

    &:hover {
      color: color-mix(in oklab, var(--accent) 80%, black);
    }
  }

  &--muted {
    color: var(--text-muted);

    &:hover {
      color: var(--accent);
    }
  }
}

.external-link-icon {
  flex-shrink: 0;
}
</style>
