import { ref } from 'vue'
import type { Ref } from 'vue'

export function useSplitPane(
  defaultSplit = 50,
  minStart = 200,
  minEnd = 200
): { splitPercent: Ref<number>; startResize: (e: MouseEvent, container: HTMLElement) => void } {
  const splitPercent = ref(defaultSplit)

  function startResize(e: MouseEvent, container: HTMLElement): void {
    const startX = e.clientX
    const startPx = (splitPercent.value / 100) * container.offsetWidth

    function onMove(ev: MouseEvent): void {
      const delta = ev.clientX - startX
      const newPx = Math.max(minStart, Math.min(container.offsetWidth - minEnd, startPx + delta))
      splitPercent.value = (newPx / container.offsetWidth) * 100
    }

    function onUp(): void {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return { splitPercent, startResize }
}
