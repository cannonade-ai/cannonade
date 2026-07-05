<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus, IconFolderOpen } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { Button, Panel, Badge, InfoTooltip } from '@renderer/components/ui'
import { storeToRefs } from 'pinia'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { useNavigationStore } from '@renderer/stores/navigation'
import { api } from '@renderer/api'
import { TestSuiteList, TestSuiteDetail } from '@renderer/components/test-suites'

const store = useTestSuitesStore()
const navigation = useNavigationStore()
const { suites } = storeToRefs(store)
const selectedId = ref<string | null>(null)

const selectedSuite = computed<TestSuite | null>(
  () => suites.value.find((s) => s.id === selectedId.value) ?? null
)

onMounted(async () => {
  await store.load()
  const pendingId = navigation.consumePendingSuiteId()
  if (pendingId) selectedId.value = pendingId
})

function onSelectSuite(id: string): void {
  selectedId.value = id
}

function onBack(): void {
  selectedId.value = null
}

async function onSave(updated: TestSuite): Promise<void> {
  await store.save(updated)
}

async function openSuitesFolder(): Promise<void> {
  const dir = await api.getSuitesDir()
  await api.openPath(dir)
}

async function onNewSuite(): Promise<void> {
  const suite = store.create()
  await store.save(suite)
  selectedId.value = suite.id
}
</script>

<template>
  <div class="view">
    <template v-if="selectedSuite">
      <TestSuiteDetail :suite="selectedSuite" @back="onBack" @save="onSave" />
    </template>

    <template v-else>
      <SectionHeader>
        <Button type="primary" :icon="IconPlus" @click="onNewSuite">New Suite</Button>
      </SectionHeader>

      <Panel class="suites-panel" title="Test Suites">
        <template #title-addon>
          <Badge>{{ suites.length }}</Badge>
          <InfoTooltip
            content="Collections of test cases with inputs and expected outputs. Run a suite against one or more models to compare results."
          />
        </template>
        <template #header-right>
          <Button v-tooltip="'Open suites folder'" type="icon" @click="openSuitesFolder">
            <IconFolderOpen :size="15" />
          </Button>
        </template>

        <TestSuiteList :suites="suites" :selected-id="selectedId" @select-suite="onSelectSuite" />
      </Panel>
    </template>
  </div>
</template>

<style scoped lang="scss">
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.suites-panel {
  flex: 1;

  :deep(.panel__body) {
    padding: 0;
  }
}
</style>
