import type { Directive, DirectiveBinding } from 'vue'
import { positionTooltip, type TooltipPlacement } from '@renderer/utils/tooltip'

interface TooltipOptions {
  content: string
  placement?: TooltipPlacement
  delay?: number
  interactive?: boolean
}

interface TooltipState {
  content: string
  placement: TooltipPlacement
  delay: number
  interactive: boolean
}

const DEFAULT_DELAY = 750
const HIDE_GRACE = 150

const stateMap = new WeakMap<HTMLElement, TooltipState>()

let tooltipEl: HTMLElement | null = null
let activeTarget: HTMLElement | null = null
let activeState: TooltipState | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function ensureTooltipEl(): HTMLElement {
  if (tooltipEl) return tooltipEl
  const el = document.createElement('div')
  el.className = 'v-tooltip'
  el.setAttribute('role', 'tooltip')
  const inner = document.createElement('div')
  inner.className = 'v-tooltip__content'
  el.appendChild(inner)
  const arrow = document.createElement('div')
  arrow.className = 'v-tooltip__arrow'
  el.appendChild(arrow)
  el.addEventListener('mouseenter', onTooltipEnter)
  el.addEventListener('mouseleave', onTooltipLeave)
  document.body.appendChild(el)
  tooltipEl = el
  return el
}

function onTooltipEnter(): void {
  if (!activeState?.interactive) return
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function onTooltipLeave(): void {
  if (!activeState?.interactive) return
  hideTooltip()
}

function hideTooltip(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (tooltipEl) tooltipEl.classList.remove('v-tooltip--visible')
  activeTarget = null
  activeState = null
}

function showTooltip(target: HTMLElement, state: TooltipState): void {
  if (!state.content) return
  const el = ensureTooltipEl()
  const inner = el.querySelector('.v-tooltip__content') as HTMLElement
  inner.textContent = state.content
  activeTarget = target
  activeState = state
  el.classList.add('v-tooltip--visible')
  el.classList.toggle('v-tooltip--interactive', state.interactive)
  positionTooltip(target, el, state.placement)
}

function parseBinding(binding: DirectiveBinding): TooltipState | null {
  const value = binding.value as string | TooltipOptions | null | undefined
  if (value == null || value === '') return null

  const argPlacement = binding.arg as TooltipPlacement | undefined
  let content: string
  let placement: TooltipPlacement
  let delay: number
  let interactive: boolean

  if (typeof value === 'string') {
    content = value
    placement = argPlacement ?? 'top'
    delay = DEFAULT_DELAY
    interactive = false
  } else {
    content = value.content
    placement = value.placement ?? argPlacement ?? 'top'
    delay = value.delay ?? DEFAULT_DELAY
    interactive = value.interactive ?? false
  }

  return { content, placement, delay, interactive }
}

function onEnter(this: HTMLElement): void {
  const state = stateMap.get(this)
  if (!state) return
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (state.delay <= 0) {
    showTooltip(this, state)
    return
  }
  showTimer = setTimeout(() => showTooltip(this, state), state.delay)
}

function onFocus(this: HTMLElement): void {
  if (!this.matches(':focus-visible')) return
  onEnter.call(this)
}

function onLeave(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (activeState?.interactive) {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(hideTooltip, HIDE_GRACE)
    return
  }
  hideTooltip()
}

export const vTooltip: Directive<HTMLElement, string | TooltipOptions> = {
  mounted(el, binding) {
    const state = parseBinding(binding)
    if (!state) return
    stateMap.set(el, state)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('focusin', onFocus)
    el.addEventListener('focusout', onLeave)
  },
  updated(el, binding) {
    const state = parseBinding(binding)
    if (!state) {
      stateMap.delete(el)
      if (activeTarget === el) hideTooltip()
      return
    }
    stateMap.set(el, state)
    if (activeTarget === el) showTooltip(el, state)
  },
  beforeUnmount(el) {
    if (activeTarget === el) hideTooltip()
    stateMap.delete(el)
    el.removeEventListener('mouseenter', onEnter)
    el.removeEventListener('mouseleave', onLeave)
    el.removeEventListener('focusin', onFocus)
    el.removeEventListener('focusout', onLeave)
  }
}
