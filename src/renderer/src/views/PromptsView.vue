<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus, IconFolderOpen } from '@tabler/icons-vue'
import type { Prompt } from '@shared/app/prompt'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import { Button, Panel, Badge, InfoTooltip } from '@renderer/components/ui'
import { storeToRefs } from 'pinia'
import { usePromptsStore } from '@renderer/stores/prompts'
import { useAppInfoStore } from '@renderer/stores/app-info'
import { api } from '@renderer/api'
import { PromptList, PromptDetail } from '@renderer/components/prompts'

const store = usePromptsStore()
const appInfo = useAppInfoStore()
const { prompts } = storeToRefs(store)
const selectedId = ref<string | null>(null)
const isNew = ref(false)

const selectedPrompt = computed<Prompt | null>(
  () => prompts.value.find((p) => p.id === selectedId.value) ?? null
)

const detailOpen = computed(() => isNew.value || selectedPrompt.value !== null)

onMounted(async () => {
  await store.ensureLoaded()
})

function onSelectPrompt(id: string): void {
  isNew.value = false
  selectedId.value = id
}

function onBack(): void {
  selectedId.value = null
  isNew.value = false
}

function onNewPrompt(): void {
  selectedId.value = null
  isNew.value = true
}

function onCreated(id: string): void {
  isNew.value = false
  selectedId.value = id
}

async function openPromptsFolder(): Promise<void> {
  await api.openPath(appInfo.promptsDir)
}
</script>

<template>
  <div class="view">
    <template v-if="detailOpen">
      <PromptDetail :prompt="selectedPrompt" @back="onBack" @created="onCreated" />
    </template>

    <template v-else>
      <SectionHeader>
        <Button type="primary" :icon="IconPlus" @click="onNewPrompt">New Prompt</Button>
      </SectionHeader>

      <Panel class="prompts-panel" title="Prompts">
        <template #title-addon>
          <Badge>{{ prompts.length }}</Badge>
          <InfoTooltip
            content="Reusable system prompts that test cases can reference. Versions are managed automatically and each prompt's history is kept."
          />
        </template>
        <template #header-right>
          <Button v-tooltip="'Open prompts folder'" type="icon" @click="openPromptsFolder">
            <IconFolderOpen :size="15" />
          </Button>
        </template>

        <PromptList :prompts="prompts" :selected-id="selectedId" @select-prompt="onSelectPrompt" />
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

.prompts-panel {
  flex: 1;

  :deep(.panel__body) {
    padding: 0;
  }
}
</style>
