<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Badge, Select, Textarea } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { usePlaygroundStore } from '@renderer/stores/playground'
import { usePromptsStore } from '@renderer/stores/prompts'

const playground = usePlaygroundStore()
const promptsStore = usePromptsStore()
const { systemPrompt, linkedPrompt } = storeToRefs(playground)

const selectedPromptId = ref<string | undefined>(linkedPrompt.value?.promptId)
const selectedVersion = ref<string | undefined>(
  linkedPrompt.value ? String(linkedPrompt.value.version) : undefined
)

const promptOptions = computed<SelectOption[]>(() =>
  promptsStore.prompts.map((p) => ({ value: p.id, label: p.name }))
)

const versionOptions = computed<SelectOption[]>(() => {
  if (!selectedPromptId.value) return []
  const prompt = promptsStore.getById(selectedPromptId.value)
  if (!prompt) return []
  const versions = prompt.versions.map((v) => ({
    value: String(v.version),
    label: `v${v.version}`
  }))
  return [{ value: 'latest', label: 'Latest' }, ...versions.reverse()]
})

const promptText = computed<string | undefined>({
  get: () => systemPrompt.value,
  set: (value) => playground.updateSystemPrompt(value ?? '')
})

watch(selectedPromptId, (promptId) => {
  if (!promptId) return
  selectedVersion.value = 'latest'
  playground.loadPrompt(promptId, 'latest')
})

watch(selectedVersion, (version) => {
  if (!selectedPromptId.value || version === undefined) return
  playground.loadPrompt(selectedPromptId.value, version === 'latest' ? 'latest' : Number(version))
})

watch(linkedPrompt, (linked) => {
  if (!linked) return
  selectedPromptId.value = linked.promptId
  selectedVersion.value = String(linked.version)
})
</script>

<template>
  <div class="system-prompt">
    <div class="system-prompt__label">
      <span>System Prompt</span>
      <template v-if="linkedPrompt">
        <Badge v-if="linkedPrompt.modified" square>modified</Badge>
        <Badge v-else type="secondary" square>linked</Badge>
      </template>
    </div>
    <div v-if="promptOptions.length" class="system-prompt__load">
      <Select
        v-model="selectedPromptId"
        class="system-prompt__prompt-select"
        :options="promptOptions"
        placeholder="Load saved prompt…"
      />
      <Select
        v-if="selectedPromptId"
        v-model="selectedVersion"
        class="system-prompt__version-select"
        :options="versionOptions"
      />
    </div>
    <Textarea v-model="promptText" placeholder="You are a helpful assistant…" :rows="5" />
  </div>
</template>

<style scoped lang="scss">
.system-prompt {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  &__load {
    display: flex;
    gap: 8px;
  }

  &__prompt-select {
    flex: 1;
    min-width: 0;
  }

  &__version-select {
    width: 5.5rem;
    flex-shrink: 0;
  }
}
</style>
