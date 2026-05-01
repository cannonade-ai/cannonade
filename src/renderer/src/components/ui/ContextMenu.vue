<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useContextMenuStore } from '@renderer/stores/context-menu'

const store = useContextMenuStore()

const dropdownStyle = computed(() => {
  if (!store.current) return {}
  const { top, left, right } = store.current.position
  return {
    top: `${top}px`,
    ...(left !== undefined && { left: `${left}px` }),
    ...(right !== undefined && { right: `${right}px` })
  }
})

function onDocumentClick(): void {
  store.close()
}

function handleItemClick(item): void {
  store.close()
  item.action()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('scroll', store.close, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('scroll', store.close, true)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="store.current" class="dropdown" :style="dropdownStyle" @click.stop>
      <button
        v-for="item in store.current.items"
        :key="item.label"
        class="dropdown-item"
        :class="{ danger: item.danger }"
        @click="handleItemClick(item)"
      >
        <component :is="item.icon" v-if="item.icon" :size="13" :stroke-width="2" />
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.dropdown {
  position: fixed;
  z-index: 1000;
  min-width: 6rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  text-align: left;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}
</style>
