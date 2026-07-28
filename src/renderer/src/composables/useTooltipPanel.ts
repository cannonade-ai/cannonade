import { nextTick, onBeforeUnmount, ref, type Ref } from 'vue'
import { positionTooltip, type TooltipPlacement } from '@renderer/utils/tooltip'

const HIDE_GRACE = 150
const FADE_OUT = 160

export interface TooltipPanelConfig {
  placement: TooltipPlacement
  delay: number
  interactive: boolean
  disabled?: boolean
}

export interface TooltipPanel {
  mounted: Ref<boolean>
  shown: Ref<boolean>
  scheduleShow: () => void
  onTriggerLeave: () => void
  onTriggerFocus: () => void
  onPanelEnter: () => void
  onPanelLeave: () => void
}

export function useTooltipPanel(
  config: TooltipPanelConfig,
  triggerEl: Ref<HTMLElement | null>,
  panelEl: Ref<HTMLElement | null>
): TooltipPanel {
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
      positionTooltip(triggerEl.value, panelEl.value, config.placement)
    }
    requestAnimationFrame(() => {
      shown.value = true
    })
  }

  function scheduleShow(): void {
    if (config.disabled) return
    clearTimers()
    if (config.delay <= 0) {
      void reveal()
      return
    }
    showTimer = setTimeout(() => void reveal(), config.delay)
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
    if (config.interactive) {
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
    if (config.interactive) clearTimers()
  }

  function onPanelLeave(): void {
    if (config.interactive) beginHide()
  }

  onBeforeUnmount(clearTimers)

  return {
    mounted,
    shown,
    scheduleShow,
    onTriggerLeave,
    onTriggerFocus,
    onPanelEnter,
    onPanelLeave
  }
}
