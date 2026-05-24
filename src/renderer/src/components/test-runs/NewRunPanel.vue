<script setup lang="ts">
import { Button, Field, Panel, RadioGroup, Select, Toggle } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import NewRunModelSelector from '@renderer/components/test-runs/NewRunModelSelector.vue'
import { useModelsStore } from '@renderer/stores/models'
import { useSettingsStore } from '@renderer/stores/settings'
import type { ModelRef, TestRunConfig } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import type { ProviderId, LocalProviderId } from '@shared/provider/ids'
import { LOCAL_PROVIDERS } from '@shared/provider/ids'
import { IconPlayerPlay, IconX } from '@tabler/icons-vue'
import { computed, onMounted, reactive, watch } from 'vue'

const props = defineProps<{
  suites: TestSuite[]
}>()

const emit = defineEmits<{
  cancel: []
  submit: [config: TestRunConfig, suite: TestSuite]
}>()

const modelsStore = useModelsStore()
const settingsStore = useSettingsStore()

const form = reactive<{
  suiteId: string
  provider: ProviderId
  models: ModelRef[]
  deleteAutoDownloadedModels: boolean
  unloadModelsAfterRun: boolean
  parallelRun: boolean
}>({
  suiteId: '',
  provider: settingsStore.lastProvider,
  models: [],
  deleteAutoDownloadedModels: false,
  unloadModelsAfterRun: false,
  parallelRun: false
})

onMounted(() => {
  const lastId = settingsStore.lastSuiteId
  const suites = props.suites
  if (lastId && suites.some((s) => s.id === lastId)) {
    form.suiteId = lastId
  } else if (suites.length > 0) {
    form.suiteId = suites[0].id
  }
})

watch(
  () => form.provider,
  (next) => {
    form.models = []
    if (next in LOCAL_PROVIDERS) form.parallelRun = false
    if (next in LOCAL_PROVIDERS) {
      modelsStore.localProvider = next as LocalProviderId
      modelsStore.loadLocalModels()
    } else {
      modelsStore.externalProvider = next as 'openrouter'
      modelsStore.loadExternalModels()
    }
  },
  { immediate: true }
)

watch(
  () => form.deleteAutoDownloadedModels,
  (val) => {
    if (val) form.unloadModelsAfterRun = true
  }
)

watch(
  () => modelsStore.loading,
  (loading) => {
    if (loading || !(form.provider in LOCAL_PROVIDERS) || form.models.length > 0) return
    const loaded = installedModels.value.find((m) => m.loaded)
    if (loaded) form.models = [{ source: 'installed', modelKey: loaded.key }]
  }
)

const installedModels = computed(() => {
  if (form.provider in LOCAL_PROVIDERS) {
    return modelsStore.localModels.map((m) => ({
      key: m.id,
      label: m.name,
      loaded: m.loadedInstances.length > 0
    }))
  }
  return modelsStore.externalModels.map((m) => ({ key: m.id, label: m.name, loaded: false }))
})

const suiteOptions = computed<SelectOption<string>[]>(() =>
  props.suites.map((s) => ({ value: s.id, label: s.name }))
)

const canSubmit = computed(() => form.suiteId !== '' && form.models.length > 0)

function onSubmit(): void {
  if (!canSubmit.value) {
    console.warn('[NewRunPanel] Cannot submit: invalid form')
    return
  }
  const suite = props.suites.find((s) => s.id === form.suiteId)
  if (!suite) {
    console.error('[NewRunPanel] Suite not found:', form.suiteId)
    return
  }
  settingsStore.lastSuiteId = form.suiteId
  settingsStore.lastProvider = form.provider
  emit(
    'submit',
    {
      suiteId: form.suiteId,
      provider: form.provider,
      models: form.models,
      deleteAutoDownloadedModels: form.deleteAutoDownloadedModels,
      unloadModelsAfterRun: form.provider === 'lmstudio' ? form.unloadModelsAfterRun : undefined,
      parallelRun: form.provider === 'openrouter' ? form.parallelRun : undefined
    },
    suite
  )
}
</script>

<template>
  <Panel title="New Run">
    <template #header-right>
      <button class="btn-close" @click="emit('cancel')">
        <IconX :size="14" :stroke-width="2.5" />
      </button>
    </template>

    <Field label="Test Suite">
      <Select v-model="form.suiteId" :options="suiteOptions" placeholder="Select a suite…" />
    </Field>

    <Field label="Provider">
      <RadioGroup
        v-model="form.provider"
        :options="[
          { value: 'lmstudio', label: 'LM Studio' },
          { value: 'ollama', label: 'Ollama' },
          { value: 'openrouter', label: 'OpenRouter' }
        ]"
      />
    </Field>

    <Field label="Models">
      <NewRunModelSelector
        v-model="form.models"
        :installed-models="installedModels"
        :loading-models="modelsStore.loading"
      />
    </Field>

    <div class="divider" />

    <Field label="Options">
      <div class="options-list">
        <label v-if="form.provider === 'lmstudio'" class="toggle-row">
          <span class="toggle-label">Unload models after run</span>
          <Toggle v-model="form.unloadModelsAfterRun" :disabled="form.deleteAutoDownloadedModels" />
        </label>
        <label v-if="form.provider === 'lmstudio'" class="toggle-row">
          <span class="toggle-label">Delete auto-downloaded models after run</span>
          <Toggle v-model="form.deleteAutoDownloadedModels" />
        </label>

        <label v-if="form.provider === 'openrouter'" class="toggle-row">
          <span class="toggle-label">Parallel run</span>
          <Toggle v-model="form.parallelRun" />
        </label>
      </div>
    </Field>

    <template #footer>
      <Button @click="emit('cancel')">Cancel</Button>
      <Button type="primary" :disabled="!canSubmit" :icon="IconPlayerPlay" @click="onSubmit">
        Run
      </Button>
    </template>
  </Panel>
</template>

<style scoped lang="scss">
.btn-close {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: var(--radius-lg);
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: var(--text-primary);
    background: var(--surface-hover);
  }
}

.divider {
  border-top: 1px solid var(--border);
  margin: 0 -0.875rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;

  .toggle-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
}
</style>
