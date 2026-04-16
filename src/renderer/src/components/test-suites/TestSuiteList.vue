<script setup lang="ts">
import { IconTag, IconTestPipe } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'

defineProps<{
  suites: TestSuite[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-suite': [id: string]
}>()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="list-wrap">
    <div v-if="suites.length === 0" class="empty">No test suites yet.</div>
    <ul v-else class="suite-list">
      <li
        v-for="suite in suites"
        :key="suite.id"
        class="suite-item"
        :class="{ active: selectedId === suite.id }"
        @click="emit('select-suite', suite.id)"
      >
        <div class="suite-main">
          <span class="suite-name">{{ suite.name }}</span>
          <span v-if="suite.description" class="suite-desc">{{ suite.description }}</span>
          <div v-if="suite.tags && suite.tags.length" class="suite-tags">
            <icon-tag :size="10" :stroke-width="2" />
            <span
              v-for="tag in suite.tags"
              :key="tag"
              class="tag"
            >{{ tag }}</span>
          </div>
        </div>
        <div class="suite-aside">
          <span class="case-count">
            <icon-test-pipe :size="11" :stroke-width="2" />
            {{ suite.testCases.length }} cases
          </span>
          <span class="suite-date">Updated {{ formatDate(suite.updatedAt) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.list-wrap {
  flex: 1;
  overflow-y: auto;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.suite-list {
  list-style: none;
}

.suite-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
}

.suite-item:hover {
  background: var(--surface-hover);
}

.suite-item.active {
  background: var(--accent-dim);
  border-left: 2px solid var(--accent);
  padding-left: 18px;
}

.suite-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.suite-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.suite-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 480px;
}

.suite-tags {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.tag {
  font-size: 0.68rem;
  background: var(--surface-elevated);
  color: var(--text-secondary);
  padding: 1px 7px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.suite-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.case-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.suite-date {
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>
