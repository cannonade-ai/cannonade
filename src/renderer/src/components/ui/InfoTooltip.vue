<script setup lang="ts">
import { IconInfoCircle } from '@tabler/icons-vue'
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { positionTooltip, type TooltipPlacement } from '@renderer/utils/tooltip'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: TooltipPlacement
    size?: number
    delay?: number
    interactive?: boolean
  }>(),
  {
    content: '',
    placement: 'top',
    size: 14,
    delay: 100,
    interactive: false
  }
)

const HIDE_GRACE = 150
const FADE_OUT = 160

const triggerEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const mounted = ref(false)
const shown = ref(false)

let showTimer: ReturnType<typeof setTimeout> | null = null
let graceTimer: ReturnType<typeof setTimeout> | null = null
let unmountTimer: ReturnType<typeof setTimeout> | null = null

function clearTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (graceTimer) {
    clearTimeout(graceTimer)
    graceTimer = null
  }
  if (unmountTimer) {
    clearTimeout(unmountTimer)
    unmountTimer = null
  }
}

async function reveal(): Promise<void> {
  clearTimers()
  mounted.value = true
  await nextTick()
  if (triggerEl.value && panelEl.value) {
    positionTooltip(triggerEl.value, panelEl.value, props.placement)
  }
  requestAnimationFrame(() => {
    shown.value = true
  })
}

function scheduleShow(): void {
  clearTimers()
  if (props.delay <= 0) {
    void reveal()
    return
  }
  showTimer = setTimeout(() => void reveal(), props.delay)
}

function beginHide(): void {
  clearTimers()
  shown.value = false
  unmountTimer = setTimeout(() => {
    mounted.value = false
  }, FADE_OUT)
}

function onTriggerLeave(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (props.interactive) {
    if (graceTimer) clearTimeout(graceTimer)
    graceTimer = setTimeout(beginHide, HIDE_GRACE)
    return
  }
  beginHide()
}

function onTriggerFocus(): void {
  if (triggerEl.value?.matches(':focus-visible')) scheduleShow()
}

function onPanelEnter(): void {
  if (props.interactive) clearTimers()
}

function onPanelLeave(): void {
  if (props.interactive) beginHide()
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <span
    ref="triggerEl"
    class="info-tooltip"
    tabindex="0"
    @mouseenter="scheduleShow"
    @mouseleave="onTriggerLeave"
    @focusin="onTriggerFocus"
    @focusout="onTriggerLeave"
  >
    <IconInfoCircle :size="size" :stroke-width="2" />
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
        <slot>{{ content }}</slot>
      </div>
      <div class="v-tooltip__arrow" />
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.info-tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: help;
  border-radius: var(--radius-full);
  outline: none;
  transition: color 0.12s;

  &:hover,
  &:focus-visible {
    color: var(--text-secondary);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-border);
  }
}
</style>
