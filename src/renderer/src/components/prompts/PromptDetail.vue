<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconArrowLeft, IconTrash, IconHistoryToggle } from '@tabler/icons-vue'
import { Button, Field, Input, Panel, Select, Textarea } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { useShortcut } from '@renderer/composables/useShortcut'
import { useConfirmStore } from '@renderer/stores/confirm'
import { usePromptsStore } from '@renderer/stores/prompts'
import { useToastStore } from '@renderer/stores/toast'
import { formatDate } from '@renderer/utils/format'
import { getLatestVersion, getPromptVersion } from '@shared/app/prompt'
import type { Prompt, PromptVersion } from '@shared/app/prompt'

const props = defineProps<{
  prompt: Prompt | null
}>()

const emit = defineEmits<{
  back: []
  created: [id: string]
}>()

const promptsStore = usePromptsStore()
const confirmStore = useConfirmStore()
const toastStore = useToastStore()

const name = ref('')
const description = ref('')
const selectedVersion = ref<string>('latest')
const content = ref('')
const errors = ref({ name: false })

const latestVersion = computed<PromptVersion | null>(() =>
  props.prompt ? getLatestVersion(props.prompt) : null
)

const versionOptions = computed<SelectOption[]>(() => {
  if (!props.prompt || !latestVersion.value) return [{ value: 'latest', label: 'Latest (v1)' }]
  return [
    { value: 'latest', label: `Latest (v${latestVersion.value.version})` },
    ...props.prompt.versions
      .slice(0, -1)
      .reverse()
      .map((v) => ({ value: String(v.version), label: `v${v.version}` }))
  ]
})

const isReadonly = computed(() => selectedVersion.value !== 'latest')

const selectedVersionInfo = computed<PromptVersion | null>(() => {
  if (!props.prompt) return null
  if (selectedVersion.value === 'latest') return latestVersion.value
  return getPromptVersion(props.prompt, Number(selectedVersion.value)) ?? null
})

const isDirty = computed(() => {
  if (!props.prompt) {
    return Boolean(name.value.trim() || description.value.trim() || content.value.trim())
  }
  if (isReadonly.value) return false
  return (
    name.value.trim() !== props.prompt.name ||
    (description.value.trim() || undefined) !== props.prompt.description ||
    content.value !== (latestVersion.value?.content ?? '')
  )
})

watch(
  () => props.prompt,
  (p) => {
    name.value = p?.name ?? ''
    description.value = p?.description ?? ''
    selectedVersion.value = 'latest'
    content.value = p ? getLatestVersion(p).content : ''
    errors.value.name = false
  },
  { immediate: true }
)

watch(selectedVersion, (v) => {
  if (!props.prompt) return
  const version = v === 'latest' ? latestVersion.value : getPromptVersion(props.prompt, Number(v))
  content.value = version?.content ?? ''
})

async function onSetAsLatest(): Promise<void> {
  if (!props.prompt || !latestVersion.value) return
  const version = Number(selectedVersion.value)
  const confirmed = await confirmStore.confirm({
    title: 'Set as Latest Version',
    message: `This will create a new version (v${latestVersion.value.version + 1}) with the content of v${version}. Existing versions are kept. Continue?`,
    confirmText: 'Set as Latest'
  })
  if (!confirmed) return
  const created = await promptsStore.setAsLatest(props.prompt, version)
  selectedVersion.value = 'latest'
  content.value = created.content
  toastStore.success(`v${version} restored as v${created.version}`)
}

async function onSave(): Promise<void> {
  errors.value.name = !name.value.trim()
  if (errors.value.name) return

  if (!props.prompt) {
    const created = await promptsStore.create(
      name.value.trim(),
      description.value.trim(),
      content.value
    )
    toastStore.success(`Prompt "${created.name}" created`)
    emit('created', created.id)
    return
  }

  const prompt = props.prompt
  prompt.name = name.value.trim()
  prompt.description = description.value.trim() || undefined

  if (!isReadonly.value && content.value !== latestVersion.value?.content) {
    const created = await promptsStore.addVersion(prompt, content.value)
    toastStore.success(`Prompt saved as new version v${created.version}`)
  } else {
    await promptsStore.save(prompt)
    toastStore.success('Prompt saved')
  }
  name.value = prompt.name
  description.value = prompt.description ?? ''
}

async function onDelete(): Promise<void> {
  if (!props.prompt) return
  const confirmed = await confirmStore.confirm({
    title: 'Delete Prompt',
    message:
      'Are you sure you want to delete this prompt and all of its versions? Test cases using it will keep their current prompt text. This action cannot be undone.',
    confirmText: 'Delete',
    danger: true
  })
  if (!confirmed) return
  await promptsStore.remove(props.prompt.id)
  emit('back')
}

useShortcut('Escape', () => emit('back'))
</script>

<template>
  <div class="detail">
    <div class="detail-header">
      <Button :icon="IconArrowLeft" :icon-stroke-width="2.5" @click="emit('back')">
        Prompts
      </Button>
    </div>

    <Panel class="prompt-panel" :title="prompt ? 'Edit Prompt' : 'New Prompt'">
      <template #footer>
        <Button v-if="prompt" type="danger-outline" :icon="IconTrash" @click="onDelete">
          Delete
        </Button>
        <div class="footer-right">
          <Button @click="emit('back')">{{ prompt ? 'Close' : 'Cancel' }}</Button>
          <Button type="primary" :disabled="isReadonly || !isDirty" @click="onSave">
            Save Prompt
          </Button>
        </div>
      </template>

      <div class="form">
        <div class="form-row">
          <Field label="Name" grow>
            <Input
              v-model="name"
              :error="errors.name"
              placeholder="Prompt name"
              @input="errors.name = false"
            />
          </Field>
          <Field v-if="prompt" label="Version">
            <Select v-model="selectedVersion" :options="versionOptions" class="version-select" />
          </Field>
        </div>

        <Field label="Description">
          <Input v-model="description" placeholder="Optional description" />
        </Field>

        <div v-if="isReadonly" class="readonly-banner">
          <IconHistoryToggle :size="14" :stroke-width="2" />
          <span>
            You are viewing v{{ selectedVersionInfo?.version }} (read-only). Set it as the latest
            version to edit it.
          </span>
          <Button type="secondary" @click="onSetAsLatest">Set as Latest</Button>
        </div>

        <Field label="Content" fill>
          <Textarea
            v-model="content"
            fill
            :disabled="isReadonly"
            placeholder="System prompt content..."
          />
        </Field>

        <span v-if="selectedVersionInfo" class="version-meta">
          v{{ selectedVersionInfo.version }} created
          {{ formatDate(selectedVersionInfo.createdAt) }}
        </span>
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
}

.prompt-panel {
  flex: 1;
  overflow: hidden;

  :deep(.panel__body) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.panel__footer) {
    justify-content: flex-start;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.version-select {
  width: 10rem;
}

.readonly-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);

  span {
    flex: 1;
  }

  svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }
}

.version-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
