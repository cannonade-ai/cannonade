<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { IconPlayerPlay, IconSettings } from '@tabler/icons-vue'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { useProvidersStore } from '@renderer/stores/providers'
import { useNavigationStore } from '@renderer/stores/navigation'
import type { TestRunConfig } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { Button } from '@renderer/components/ui'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { TestRunList, TestRunDetail, NewRunPanel } from '@renderer/components/test-runs'

const store = useTestRunsStore()
const suitesStore = useTestSuitesStore()
const providers = useProvidersStore()
const nav = useNavigationStore()

const hasProviders = computed(() => providers.configuredProviders.length > 0)

onMounted(() => {
  if (suitesStore.suites.length === 0) suitesStore.load()
  if (store.runs.length === 0) store.load()
})

function onSubmit(config: TestRunConfig, suite: TestSuite): void {
  store.submitRun(config, suite)
}
</script>

<template>
  <div class="view">
    <SectionHeader v-if="hasProviders">
      <Button type="primary" :icon="IconPlayerPlay" @click="store.startNewRun"> New Run </Button>
    </SectionHeader>

    <div v-if="!hasProviders" class="no-providers">
      <IconSettings :size="24" :stroke-width="1.5" color="#ffffff30" />
      <span>No providers configured</span>
      <Button :icon="IconSettings" @click="nav.openSettings('providers')">
        Configure Provider
      </Button>
    </div>

    <div v-else class="panels">
      <TestRunList
        :runs="store.runs"
        :selected-id="store.selectedRunId"
        @select-run="store.selectRun"
      />
      <NewRunPanel
        v-if="store.isCreatingNew"
        :suites="suitesStore.suites"
        @cancel="store.cancelNewRun"
        @submit="onSubmit"
      />
      <TestRunDetail v-else-if="store.selectedRun" :run="store.selectedRun" />
      <div v-else class="empty-detail">
        <IconPlayerPlay :size="24" :stroke-width="1.5" color="#ffffff30" />
        <span>Select a run or start a new one</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.panels {
  display: grid;
  grid-template-columns: 20rem 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.no-providers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  flex: 1;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: var(--text-sm);
  border: 1px solid var(--border);
  background: var(--surface);
}
</style>
