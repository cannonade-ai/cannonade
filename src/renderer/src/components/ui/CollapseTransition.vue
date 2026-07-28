<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

defineProps<{
  open: boolean
}>()

let contentObserver: ResizeObserver | null = null

function stopTracking(): void {
  contentObserver?.disconnect()
  contentObserver = null
}

function trackContentHeight(node: HTMLElement): void {
  stopTracking()
  contentObserver = new ResizeObserver(() => {
    node.style.height = `${node.scrollHeight}px`
  })
  for (const child of Array.from(node.children)) {
    contentObserver.observe(child)
  }
}

function onHeightSettled(node: HTMLElement, done: () => void): void {
  function handle(event: TransitionEvent): void {
    if (event.target !== node || event.propertyName !== 'height') return
    node.removeEventListener('transitionend', handle)
    done()
  }
  node.addEventListener('transitionend', handle)
}

function onEnter(el: Element, done: () => void): void {
  const node = el as HTMLElement
  node.style.height = '0'
  node.style.overflow = 'hidden'
  void node.offsetHeight
  node.style.height = `${node.scrollHeight}px`
  onHeightSettled(node, done)
  trackContentHeight(node)
}

function onAfterEnter(el: Element): void {
  stopTracking()
  const node = el as HTMLElement
  node.style.height = ''
  node.style.overflow = ''
}

function onLeave(el: Element, done: () => void): void {
  stopTracking()
  const node = el as HTMLElement
  node.style.height = `${node.scrollHeight}px`
  node.style.overflow = 'hidden'
  void node.offsetHeight
  node.style.height = '0'
  onHeightSettled(node, done)
}

onBeforeUnmount(stopTracking)
</script>

<template>
  <Transition :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
    <div v-if="open" class="collapse-transition">
      <slot />
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.collapse-transition {
  transition: height 0.2s ease;
}
</style>
