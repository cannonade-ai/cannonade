<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSettingsStore } from '@renderer/stores/settings'
import { useHtmlPreviewHeight } from '@renderer/composables/useHtmlPreviewHeight'
import { buildPreviewDocument } from '@renderer/utils/html-output'

const props = defineProps<{
  content: string
}>()

const settings = useSettingsStore()
const { height, setHeight } = useHtmlPreviewHeight()

const wrapperEl = ref<HTMLElement | null>(null)

const srcdoc = computed<string>(() =>
  buildPreviewDocument(props.content, settings.htmlPreviewTemplate)
)

let observer: ResizeObserver | null = null

onMounted(() => {
  const el = wrapperEl.value
  if (!el) return
  observer = new ResizeObserver(([entry]) => {
    const borderBox = entry.borderBoxSize?.[0]?.blockSize
    setHeight(borderBox ?? el.offsetHeight)
  })
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div ref="wrapperEl" class="html-preview" :style="{ height: `${height}px` }">
    <iframe :srcdoc="srcdoc" sandbox="" title="HTML preview" />
  </div>
</template>

<style scoped lang="scss">
.html-preview {
  position: relative;
  width: 100%;
  min-height: 120px;
  resize: vertical;
  overflow: hidden;
  border: 1px solid var(--border);
  background: #fff;

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    width: 10px;
    height: 10px;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cpath d='M9 2L2 9M9 5.5L5.5 9' stroke='rgba(120,120,130,0.5)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
  }
}
</style>
