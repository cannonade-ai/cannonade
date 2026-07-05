<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { IconBookmarkPlus } from '@tabler/icons-vue'
import { Button, Field, Input, Modal, Select, Textarea } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { usePromptsStore } from '@renderer/stores/prompts'
import { useToastStore } from '@renderer/stores/toast'
import { getLatestVersion } from '@shared/app/prompt'
import type { TestCasePromptRef } from '@shared/app/test-suite'

const promptsStore = usePromptsStore()
const toastStore = useToastStore()

const content = defineModel<string>('content', { required: true })
const promptRef = defineModel<TestCasePromptRef | null>('promptRef', { required: true })

onMounted(() => promptsStore.ensureLoaded())

const promptOptions = computed<SelectOption[]>(() => [
  { value: '', label: 'Free text' },
  ...promptsStore.prompts.map((p) => ({ value: p.id, label: p.name }))
])

const selectedPrompt = computed(() =>
  promptRef.value ? promptsStore.getById(promptRef.value.promptId) : null
)

const versionOptions = computed<SelectOption[]>(() => {
  const prompt = selectedPrompt.value
  if (!prompt) return [{ value: 'latest', label: 'Latest' }]
  return [
    { value: 'latest', label: `Latest (v${getLatestVersion(prompt).version})` },
    ...prompt.versions
      .slice()
      .reverse()
      .map((v) => ({ value: String(v.version), label: `v${v.version}` }))
  ]
})

const selectedPromptId = computed<string>({
  get: () => promptRef.value?.promptId ?? '',
  set: (id) => {
    if (!id) {
      promptRef.value = null
      return
    }
    promptRef.value = { promptId: id, version: 'latest' }
    const prompt = promptsStore.getById(id)
    if (prompt) content.value = getLatestVersion(prompt).content
  }
})

const selectedVersion = computed<string>({
  get: () => {
    const version = promptRef.value?.version
    return version && version !== 'latest' ? String(version) : 'latest'
  },
  set: (v) => {
    if (!promptRef.value) return
    promptRef.value = {
      promptId: promptRef.value.promptId,
      version: v === 'latest' ? 'latest' : Number(v)
    }
    const resolved = promptsStore.resolveContent(promptRef.value)
    if (resolved !== null) content.value = resolved
  }
})

const isReadonly = computed(() => promptRef.value !== null && promptRef.value.version !== 'latest')

watch(
  [promptRef, () => promptsStore.prompts.length],
  async () => {
    if (!promptRef.value) return
    await promptsStore.ensureLoaded()
    const currentRef = promptRef.value
    if (!currentRef) return
    if (!promptsStore.getById(currentRef.promptId)) {
      promptRef.value = null
      return
    }
    const resolved = promptsStore.resolveContent(currentRef)
    if (resolved !== null) content.value = resolved
  },
  { immediate: true }
)

async function commit(): Promise<void> {
  const currentRef = promptRef.value
  if (!currentRef || currentRef.version !== 'latest') return
  const prompt = promptsStore.getById(currentRef.promptId)
  if (!prompt) return
  if (getLatestVersion(prompt).content !== content.value) {
    const created = await promptsStore.addVersion(prompt, content.value)
    toastStore.success(`Prompt "${prompt.name}" updated to v${created.version}`)
  }
}

defineExpose({ commit })

const modalOpen = ref(false)
const newName = ref('')
const newDescription = ref('')
const newNameError = ref(false)

function openSaveAsPrompt(): void {
  newName.value = ''
  newDescription.value = ''
  newNameError.value = false
  modalOpen.value = true
}

async function onSaveAsPrompt(): Promise<void> {
  newNameError.value = !newName.value.trim()
  if (newNameError.value) return
  const prompt = await promptsStore.create(
    newName.value.trim(),
    newDescription.value.trim(),
    content.value
  )
  promptRef.value = { promptId: prompt.id, version: 'latest' }
  modalOpen.value = false
  toastStore.success(`Prompt "${prompt.name}" created`)
}
</script>

<template>
  <Field
    label="System Prompt"
    hint="Instructions that set the model's role and behavior before it sees the user input. Pick a saved prompt or write free text."
  >
    <div class="prompt-source">
      <Select v-model="selectedPromptId" :options="promptOptions" class="prompt-select" />
      <Select
        v-if="selectedPromptId"
        v-model="selectedVersion"
        :options="versionOptions"
        class="version-select"
      />
      <Button
        v-if="!selectedPromptId && content.trim()"
        v-tooltip="'Save as reusable prompt'"
        type="icon"
        class="save-as-btn"
        @click="openSaveAsPrompt"
      >
        <IconBookmarkPlus :size="15" />
      </Button>
    </div>
    <Textarea
      v-model="content"
      :rows="4"
      :disabled="isReadonly"
      placeholder="System instructions for the model..."
    />
    <span v-if="isReadonly" class="prompt-note">
      Pinned to v{{ promptRef?.version }} — read-only. Select "Latest" to edit.
    </span>
    <span v-else-if="selectedPromptId" class="prompt-note">
      Editing the latest version. Changes are saved as a new prompt version when the test case is
      saved.
    </span>
  </Field>

  <Modal v-model="modalOpen" title="Save as Prompt">
    <div class="modal-fields">
      <Field label="Name">
        <Input
          v-model="newName"
          :error="newNameError"
          placeholder="Prompt name"
          @input="newNameError = false"
        />
      </Field>
      <Field label="Description">
        <Input v-model="newDescription" placeholder="Optional description" />
      </Field>
    </div>
    <template #actions>
      <Button @click="modalOpen = false">Cancel</Button>
      <Button type="primary" @click="onSaveAsPrompt">Save Prompt</Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.prompt-source {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.prompt-select {
  flex: 2;
  min-width: 0;
}

.version-select {
  flex: 1;
  min-width: 0;
}

.save-as-btn {
  flex-shrink: 0;
}

.prompt-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.modal-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
