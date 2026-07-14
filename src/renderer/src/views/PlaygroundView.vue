<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { IconPlus, IconTrash } from '@tabler/icons-vue'
import { Button, InfoTooltip, Panel, SplitPane } from '@renderer/components/ui'
import SectionHeader from '@renderer/components/SectionHeader.vue'
import {
  PlaygroundMessageList,
  PlaygroundComposer,
  PlaygroundSettingsPanel
} from '@renderer/components/playground'
import { usePlaygroundStore } from '@renderer/stores/playground'
import { usePromptsStore } from '@renderer/stores/prompts'
import { useNavigationStore } from '@renderer/stores/navigation'

const playground = usePlaygroundStore()
const promptsStore = usePromptsStore()
const navigationStore = useNavigationStore()
const { messages, sending, canSend } = storeToRefs(playground)

onMounted(async () => {
  await promptsStore.ensureLoaded()
  await playground.init()
  const payload = navigationStore.consumePayload()
  if (payload?.promptId) playground.loadPrompt(payload.promptId, 'latest')
  if (payload?.providerId && payload?.modelId) {
    await playground.selectModel(payload.providerId, payload.modelId)
  }
})
</script>

<template>
  <div class="view">
    <SectionHeader>
      <Button
        type="primary"
        :icon="IconPlus"
        :disabled="messages.length === 0 || sending"
        @click="playground.clear"
      >
        New Conversation
      </Button>
    </SectionHeader>

    <SplitPane class="playground-split" :default-split="65" :min-start="360" :min-end="300">
      <template #start>
        <Panel class="conversation-panel" title="Conversation">
          <template #title-addon>
            <InfoTooltip
              content="Conversations are not saved and will be lost when the app closes."
            />
          </template>
          <template #header-right>
            <Button
              v-tooltip="'Clear conversation'"
              type="icon"
              :disabled="messages.length === 0 || sending"
              @click="playground.clear"
            >
              <IconTrash :size="15" />
            </Button>
          </template>

          <PlaygroundMessageList
            :messages="messages"
            :sending="sending"
            @retry="playground.retryLast"
          />

          <template #footer>
            <PlaygroundComposer
              :sending="sending"
              :can-send="canSend"
              @send="playground.send"
              @stop="playground.abort"
            />
          </template>
        </Panel>
      </template>
      <template #end>
        <PlaygroundSettingsPanel class="settings-panel" />
      </template>
    </SplitPane>
  </div>
</template>

<style scoped lang="scss">
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
}

.playground-split {
  flex: 1;
  min-height: 0;
}

.conversation-panel {
  height: 100%;

  :deep(.panel__body) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.panel__footer) {
    justify-content: stretch;
  }
}

.settings-panel {
  height: 100%;
  margin-left: 8px;
}
</style>
