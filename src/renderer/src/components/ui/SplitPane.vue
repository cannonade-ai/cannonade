<script setup lang="ts">
import { useSplitPane } from '@renderer/composables/useSplitPane'
import { useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    defaultSplit?: number
    minStart?: number
    minEnd?: number
  }>(),
  {
    defaultSplit: 50,
    minStart: 200,
    minEnd: 200
  }
)

const root = useTemplateRef<HTMLElement>('root')
const { splitPercent, startResize } = useSplitPane(props.defaultSplit, props.minStart, props.minEnd)

function onDividerMousedown(e: MouseEvent): void {
  if (root.value) startResize(e, root.value)
}
</script>

<template>
  <div ref="root" class="split-pane">
    <div class="split-pane__start" :style="{ width: splitPercent + '%' }">
      <slot name="start" />
    </div>
    <div class="split-pane__divider" @mousedown="onDividerMousedown">
      <div class="split-pane__grip" @mousedown="onDividerMousedown" />
    </div>
    <div class="split-pane__end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.split-pane {
  display: flex;
  height: 100%;
  width: 100%;

  &__start {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
  }

  &__divider {
    width: 4px;
    flex-shrink: 0;
    cursor: col-resize;
    background: var(--border);
    transition: background 0.15s;
    position: relative;

    &:hover {
      background: var(--accent);

      .split-pane__grip {
        opacity: 1;
      }
    }
  }

  &__grip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 2rem;
    border-radius: 6px;
    background: var(--text-muted);
    opacity: 1;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  &__end {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-width: 0;
  }
}
</style>
