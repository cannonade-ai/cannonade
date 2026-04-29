<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconPlayerStop } from '@tabler/icons-vue'
import type { TestRun } from '@shared/app/test-run'
import type { TestCase } from '@shared/app/test-suite'
import BaseButton from '@renderer/components/base/BaseButton.vue'
import BaseModal from '@renderer/components/base/BaseModal.vue'
import BasePanel from '@renderer/components/base/BasePanel.vue'
import ModelRunRow from '@renderer/components/test-runs/ModelRunRow.vue'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { formatDate } from '@renderer/utils/format'

const props = defineProps<{
  run: TestRun
}>()

const store = useTestRunsStore()
const suitesStore = useTestSuitesStore()

const testCases = computed<TestCase[]>(
  () => suitesStore.suites.find((s) => s.id === props.run.suiteId)?.testCases ?? []
)
const showCancelModal = ref(false)

const isActive = computed(() => props.run.status === 'running' || props.run.status === 'pending')

function confirmCancel(): void {
  store.cancelRun(props.run.id)
  showCancelModal.value = false
}
</script>

<template>
  <BasePanel title="Test Run Details">
    <template #header-right>
      <span class="meta-tag">{{
        run.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'
      }}</span>
      <span v-if="run.config.parallelRun" class="meta-tag">Parallel</span>
      <span class="meta-date">{{ formatDate(run.createdAt) }}</span>
    </template>

    <template v-if="isActive" #toolbar>
      <BaseButton type="danger-outline" :icon="IconPlayerStop" @click="showCancelModal = true">
        Stop Run
      </BaseButton>
    </template>

    <BaseModal v-model="showCancelModal" title="Stop Run">
      Are you sure you want to stop this run? Any in-progress model evaluations will be cancelled.
      <template #actions="{ close }">
        <BaseButton @click="close">Cancel</BaseButton>
        <BaseButton type="danger-outline" @click="confirmCancel">Stop Run</BaseButton>
      </template>
    </BaseModal>

    <div class="section-label">Model Results</div>
    <div class="model-list">
      <ModelRunRow
        v-for="(mr, i) in run.modelRuns"
        :key="mr.id"
        :model-run="mr"
        :test-cases="testCases"
        :expanded="i === 0"
      />
    </div>
  </BasePanel>
</template>

<style scoped>
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
</style>
