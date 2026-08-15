import { ref, type Ref } from 'vue'

const DEFAULT_HEIGHT = 300
const MIN_HEIGHT = 120

const height = ref(DEFAULT_HEIGHT)

export function useHtmlPreviewHeight(): {
  height: Ref<number>
  setHeight: (value: number) => void
} {
  function setHeight(value: number): void {
    height.value = Math.max(MIN_HEIGHT, Math.round(value))
  }

  return { height, setHeight }
}
