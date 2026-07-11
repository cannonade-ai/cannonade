<script setup lang="ts">
import { ref } from 'vue'
import Chevron from './Chevron.vue'

const props = withDefaults(
  defineProps<{
    label: string
    defaultOpen?: boolean
  }>(),
  {
    defaultOpen: false
  }
)

const open = ref(props.defaultOpen)

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
  <div class="collapse">
    <button type="button" class="collapse__toggle" @click="open = !open">
      <span class="collapse__label">
        <span>{{ label }}</span>
        <slot name="label-addon" />
      </span>
      <Chevron class="chevron" :expanded="open" />
    </button>
    <Transition :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <div v-if="open" class="collapse__content">
        <div class="collapse__inner">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.collapse {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);

  &__toggle {
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    transition: color 0.15s;

    &:hover {
      color: var(--text-secondary);
    }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__content {
    transition: height 0.2s ease;
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 14px 14px 14px;
  }
}
</style>
