import type { Directive, DirectiveBinding } from 'vue'

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipOptions {
  content: string
  placement?: TooltipPlacement
}

interface TooltipState {
  content: string
  placement: TooltipPlacement
}

const SHOW_DELAY = 300
const GAP = 8

const stateMap = new WeakMap<HTMLElement, TooltipState>()

let tooltipEl: HTMLElement | null = null
let activeTarget: HTMLElement | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null

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
  document.body.appendChild(el)
  tooltipEl = el
  return el
}

function position(target: HTMLElement, placement: TooltipPlacement): void {
  if (!tooltipEl) return
  const rect = target.getBoundingClientRect()
  const tip = tooltipEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = 0
  let left = 0

  switch (placement) {
    case 'bottom':
      top = rect.bottom + GAP
      left = rect.left + rect.width / 2 - tip.width / 2
      break
    case 'left':
      top = rect.top + rect.height / 2 - tip.height / 2
      left = rect.left - tip.width - GAP
      break
    case 'right':
      top = rect.top + rect.height / 2 - tip.height / 2
      left = rect.right + GAP
      break
    case 'top':
    default:
      top = rect.top - tip.height - GAP
      left = rect.left + rect.width / 2 - tip.width / 2
      break
  }

  left = Math.max(GAP, Math.min(left, vw - tip.width - GAP))
  top = Math.max(GAP, Math.min(top, vh - tip.height - GAP))

  tooltipEl.style.top = `${Math.round(top)}px`
  tooltipEl.style.left = `${Math.round(left)}px`
  tooltipEl.dataset.placement = placement
}

function hideTooltip(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (tooltipEl) tooltipEl.classList.remove('v-tooltip--visible')
  activeTarget = null
}

function showTooltip(target: HTMLElement, state: TooltipState): void {
  if (!state.content) return
  const el = ensureTooltipEl()
  const inner = el.querySelector('.v-tooltip__content') as HTMLElement
  inner.textContent = state.content
  activeTarget = target
  el.classList.add('v-tooltip--visible')
  position(target, state.placement)
}

function parseBinding(binding: DirectiveBinding): TooltipState | null {
  const value = binding.value as string | TooltipOptions | null | undefined
  if (value == null || value === '') return null

  const argPlacement = binding.arg as TooltipPlacement | undefined
  let content: string
  let placement: TooltipPlacement

  if (typeof value === 'string') {
    content = value
    placement = argPlacement ?? 'top'
  } else {
    content = value.content
    placement = value.placement ?? argPlacement ?? 'top'
  }

  return { content, placement }
}

function onEnter(this: HTMLElement): void {
  const state = stateMap.get(this)
  if (!state) return
  if (showTimer) clearTimeout(showTimer)
  showTimer = setTimeout(() => showTooltip(this, state), SHOW_DELAY)
}

function onLeave(): void {
  hideTooltip()
}

export const vTooltip: Directive<HTMLElement, string | TooltipOptions> = {
  mounted(el, binding) {
    const state = parseBinding(binding)
    if (!state) return
    stateMap.set(el, state)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('focusin', onEnter)
    el.addEventListener('focusout', onLeave)
    el.addEventListener('click', onLeave)
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
    el.removeEventListener('focusin', onEnter)
    el.removeEventListener('focusout', onLeave)
    el.removeEventListener('click', onLeave)
  }
}
