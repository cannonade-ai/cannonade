<script setup lang="ts">
import { ref } from 'vue'
import { useTooltipPanel } from '@renderer/composables/useTooltipPanel'
import type { TooltipPlacement } from '@renderer/utils/tooltip'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: TooltipPlacement
    delay?: number
    interactive?: boolean
    disabled?: boolean
  }>(),
  {
    content: '',
    placement: 'top',
    delay: 100,
    interactive: false,
    disabled: false
  }
)

const triggerEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

const { mounted, shown, scheduleShow, onTriggerLeave, onTriggerFocus, onPanelEnter, onPanelLeave } =
  useTooltipPanel(props, triggerEl, panelEl)
</script>

<template>
  <span
    ref="triggerEl"
    class="tooltip-trigger"
    tabindex="0"
    @mouseenter="scheduleShow"
    @mouseleave="onTriggerLeave"
    @focusin="onTriggerFocus"
    @focusout="onTriggerLeave"
  >
    <slot name="trigger" />
  </span>
  <Teleport to="body">
    <div
      v-if="mounted"
      ref="panelEl"
      class="v-tooltip"
      :class="{ 'v-tooltip--visible': shown, 'v-tooltip--interactive': interactive }"
      role="tooltip"
      @mouseenter="onPanelEnter"
      @mouseleave="onPanelLeave"
    >
      <div class="v-tooltip__content">
        <slot name="content">{{ content }}</slot>
      </div>
      <div class="v-tooltip__arrow" />
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.tooltip-trigger {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  outline: none;
  border-radius: var(--radius-sm);

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-border);
  }
}
</style>
