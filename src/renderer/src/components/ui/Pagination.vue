<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.page * props.pageSize, props.total))

function goTo(page: number): void {
  const clamped = Math.min(Math.max(1, page), pageCount.value)
  if (clamped !== props.page) emit('update:page', clamped)
}
</script>

<template>
  <div v-if="pageCount > 1" class="pagination">
    <span class="pagination__range">{{ rangeStart }}–{{ rangeEnd }} of {{ total }}</span>
    <div class="pagination__controls">
      <button
        class="pagination__btn"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="goTo(page - 1)"
      >
        <IconChevronLeft :size="14" :stroke-width="2" />
      </button>
      <span class="pagination__page">{{ page }} / {{ pageCount }}</span>
      <button
        class="pagination__btn"
        :disabled="page >= pageCount"
        aria-label="Next page"
        @click="goTo(page + 1)"
      >
        <IconChevronRight :size="14" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  &__range {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__page {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    min-width: 3.5rem;
    text-align: center;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;

    &:hover:not(:disabled) {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
