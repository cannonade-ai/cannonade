<script setup lang="ts">
import { IconCheck, IconCopy } from '@tabler/icons-vue'
import { ref } from 'vue'

const props = defineProps<{ value: string; inset?: boolean }>()

const copied = ref(false)

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(props.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <div class="copy-wrap">
    <slot />
    <button
      v-if="value"
      type="button"
      class="copy-btn"
      :class="{ 'copy-btn--inset': inset }"
      @click.stop="copy"
    >
      <IconCheck v-if="copied" :size="13" :stroke-width="2.5" />
      <IconCopy v-else :size="13" :stroke-width="2" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.copy-wrap {
  position: relative;

  &:hover .copy-btn {
    opacity: 1;
  }
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;

  &--inset {
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted);
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
</style>
