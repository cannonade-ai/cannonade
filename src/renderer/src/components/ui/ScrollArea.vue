<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const viewport = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const thumb = ref<HTMLElement | null>(null)
const visible = ref(false)
const thumbHeight = ref(0)

const minThumb = 24

const dragging = ref(false)
let dragStartY = 0
let dragStartScroll = 0
let maxScroll = 0
let maxThumbTop = 0
let rafId = 0
let resizeObserver: ResizeObserver | null = null

function positionThumb(): void {
  const el = viewport.value
  const bar = thumb.value
  if (!el || !bar) return
  const top = maxScroll > 0 ? (el.scrollTop / maxScroll) * maxThumbTop : 0
  bar.style.transform = `translateY(${top}px)`
}

function onScroll(): void {
  if (rafId) return
  rafId = requestAnimationFrame((): void => {
    rafId = 0
    positionThumb()
  })
}

function recalc(): void {
  const el = viewport.value
  if (!el) return
  const { scrollHeight, clientHeight } = el
  if (scrollHeight <= clientHeight) {
    visible.value = false
    maxScroll = 0
    return
  }
  visible.value = true
  const height = Math.max((clientHeight / scrollHeight) * clientHeight, minThumb)
  thumbHeight.value = height
  maxThumbTop = clientHeight - height
  maxScroll = scrollHeight - clientHeight
  positionThumb()
}

function onThumbPointerDown(e: PointerEvent): void {
  dragging.value = true
  dragStartY = e.clientY
  dragStartScroll = viewport.value?.scrollTop ?? 0
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onThumbPointerMove(e: PointerEvent): void {
  const el = viewport.value
  if (!dragging.value || !el || maxThumbTop <= 0) return
  const delta = ((e.clientY - dragStartY) / maxThumbTop) * maxScroll
  el.scrollTop = dragStartScroll + delta
}

function onThumbPointerUp(e: PointerEvent): void {
  dragging.value = false
  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
}

onMounted((): void => {
  recalc()
  resizeObserver = new ResizeObserver(recalc)
  if (viewport.value) resizeObserver.observe(viewport.value)
  if (content.value) resizeObserver.observe(content.value)
})

onBeforeUnmount((): void => {
  resizeObserver?.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="scroll-area">
    <div ref="viewport" class="scroll-area__viewport" @scroll="onScroll">
      <div ref="content" class="scroll-area__content">
        <slot />
      </div>
    </div>
    <div v-show="visible" class="scroll-area__bar">
      <div
        ref="thumb"
        class="scroll-area__thumb"
        :class="{ dragging }"
        :style="{ height: `${thumbHeight}px` }"
        @pointerdown="onThumbPointerDown"
        @pointermove="onThumbPointerMove"
        @pointerup="onThumbPointerUp"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.scroll-area {
  position: relative;
  height: 100%;
  min-height: 0;

  &__viewport {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__bar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 6px;
    pointer-events: none;
  }

  &__thumb {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    border-radius: var(--radius-full);
    background: var(--border-hover);
    pointer-events: auto;
    transition: background 0.12s;

    &:hover,
    &.dragging {
      background: var(--text-muted);
    }
  }
}
</style>
