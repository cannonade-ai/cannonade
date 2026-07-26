<script setup lang="ts">
defineProps<{
  open: boolean
}>()

function onEnter(el: Element, done: () => void): void {
  const node = el as HTMLElement
  node.style.height = '0'
  node.style.overflow = 'hidden'
  void node.offsetHeight
  node.style.height = `${node.scrollHeight}px`
  node.addEventListener('transitionend', done, { once: true })
}

function onAfterEnter(el: Element): void {
  const node = el as HTMLElement
  node.style.height = ''
  node.style.overflow = ''
}

function onLeave(el: Element, done: () => void): void {
  const node = el as HTMLElement
  node.style.height = `${node.scrollHeight}px`
  node.style.overflow = 'hidden'
  void node.offsetHeight
  node.style.height = '0'
  node.addEventListener('transitionend', done, { once: true })
}
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
