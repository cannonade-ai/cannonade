<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus, IconFolderOpen } from '@tabler/icons-vue'
import type { TestSuite } from '@shared/app/test-suite'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { Button, Panel, Badge } from '@renderer/components/ui'
import { storeToRefs } from 'pinia'
import { useTestSuitesStore } from '@renderer/stores/test-suites'
import { api } from '@renderer/api'
import { TestSuiteList, TestSuiteDetail } from '@renderer/components/test-suites'

const store = useTestSuitesStore()
const { suites } = storeToRefs(store)
const selectedId = ref<string | null>(null)

const selectedSuite = computed<TestSuite | null>(
  () => suites.value.find((s) => s.id === selectedId.value) ?? null
)

onMounted(() => store.load())

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
