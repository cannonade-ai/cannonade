<script setup lang="ts">
import { computed } from 'vue'
import { IconPlayerStop, IconTrash, IconEdit } from '@tabler/icons-vue'
import type { TestRun } from '@shared/app/test-run'
import { Button, Panel } from '@renderer/components/ui'
import ModelRunRow from '@renderer/components/test-runs/ModelRunRow.vue'
import TestRunDetailFieldsMenu from '@renderer/components/test-runs/TestRunDetailFieldsMenu.vue'
import { useShortcut } from '@renderer/composables/useShortcut'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useConfirmStore } from '@renderer/stores/confirm'
import { useNavigationStore } from '@renderer/stores/navigation'
import { formatDate } from '@renderer/utils/format'

const props = defineProps<{
  run: TestRun
}>()

const store = useTestRunsStore()
const confirm = useConfirmStore()
const navigation = useNavigationStore()

function editTestSuite(): void {
  navigation.navigate('test-suites', { suiteId: props.run.config.suiteId })
}

const isActive = computed(() => props.run.status === 'running' || props.run.status === 'pending')

async function showStopConfirm(): Promise<void> {
  const ok = await confirm.confirm({
    title: 'Stop Run',
    message:
      'Are you sure you want to stop this run? Any in-progress model evaluations will be cancelled.',
    confirmText: 'Stop Run',
    danger: true
  })
  if (ok) store.cancelRun(props.run.id)
}

async function showDeleteConfirm(): Promise<void> {
  const ok = await confirm.confirm({
    title: 'Delete Run',
    message: 'Are you sure you want to delete this run? This action cannot be undone.',
    confirmText: 'Delete Run',
    danger: true
  })
  if (ok) store.deleteRun(props.run.id)
}

useShortcut('Ctrl+Delete', () => showDeleteConfirm(), { preventDefault: true })
</script>

<template>
  <Panel title="Test Run Details">
    <template #header-right>
      <span class="meta-tag">{{ run.config.providerName ?? run.config.provider }}</span>
      <span v-if="run.config.parallelRun" class="meta-tag">Parallel</span>
      <span class="meta-date">{{ formatDate(run.createdAt) }}</span>
    </template>

    <template #toolbar-left>
      <Button type="secondary" :icon="IconEdit" @click="editTestSuite">Edit Test Suite</Button>
    </template>

    <template #toolbar-right>
      <Button v-if="isActive" type="danger-outline" :icon="IconPlayerStop" @click="showStopConfirm">
        Stop
      </Button>
      <Button
        v-tooltip="'Ctrl + Delete'"
        type="danger-outline"
        :icon="IconTrash"
        @click="showDeleteConfirm"
      >
        Delete
      </Button>
      <TestRunDetailFieldsMenu />
    </template>

    <!--<div class="section-label">Model Results</div>-->
    <div class="model-list">
      <ModelRunRow
        v-for="(mr, i) in run.modelRuns"
        :key="mr.id"
        :model-run="mr"
        :test-cases="run.testCases ?? []"
        :expanded="i === 0"
      />
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.meta-tag {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 7px;
  background: var(--surface-elevated);
  color: var(--text-muted);
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.meta-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.section-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  font-family: var(--font-headline);
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.panel__body) {
  scrollbar-gutter: stable;
}
</style>
