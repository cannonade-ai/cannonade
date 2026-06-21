export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

const GAP = 8

export function positionTooltip(
  target: HTMLElement,
  tooltipEl: HTMLElement,
  placement: TooltipPlacement
): void {
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
