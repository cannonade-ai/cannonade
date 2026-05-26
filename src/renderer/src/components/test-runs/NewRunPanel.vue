<script setup lang="ts">
import { Button, Field, Panel, RadioGroup, Select, Toggle } from '@renderer/components/ui'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import NewRunModelSelector from '@renderer/components/test-runs/NewRunModelSelector.vue'
import { useModelsStore } from '@renderer/stores/models'
import { useSettingsStore } from '@renderer/stores/settings'
import type { ModelRef, TestRunConfig } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import { KNOWN_PROVIDER_DEFAULTS } from '@shared/provider/configured-provider'
import { IconPlayerPlay, IconX } from '@tabler/icons-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps<{
  suites: TestSuite[]
}>()

const emit = defineEmits<{
  cancel: []
  submit: [config: TestRunConfig, suite: TestSuite]
}>()

const modelsStore = useModelsStore()
const settingsStore = useSettingsStore()

const capabilities = ref<ProviderCapabilities | null>(null)

const localProviderOptions = computed<{ value: string; label: string }[]>(() =>
  settingsStore.configuredProviders
    .filter((p) => !KNOWN_PROVIDER_DEFAULTS[p.type].isExternal)
    .map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const externalProviderOptions = computed<{ value: string; label: string }[]>(() =>
  settingsStore.configuredProviders
    .filter((p) => KNOWN_PROVIDER_DEFAULTS[p.type].isExternal)
    .map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const allProviderOptions = computed(() => [
  ...localProviderOptions.value,
  ...externalProviderOptions.value
])

function isLocalProvider(instanceId: string): boolean {
  const provider = settingsStore.configuredProviders.find((p) => p.instanceId === instanceId)
  return provider ? !KNOWN_PROVIDER_DEFAULTS[provider.type].isExternal : false
}

const initialProvider =
  settingsStore.configuredProviders.find((p) => p.isDefault)?.instanceId ??
  settingsStore.configuredProviders[0]?.instanceId ??
  'openrouter'

const form = reactive<{
  suiteId: string
  provider: string
  models: ModelRef[]
  deleteAutoDownloadedModels: boolean
  unloadModelsAfterRun: boolean
  parallelRun: boolean
}>({
  suiteId: '',
  provider: initialProvider,
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
  async (next) => {
    if (!next) return
    form.models = []
    capabilities.value = await modelsStore.getCapabilities(next)
    if (!capabilities.value.localModels) form.parallelRun = false
    if (isLocalProvider(next)) {
      modelsStore.setLocalProvider(next)
      modelsStore.loadLocalModels()
    } else {
      modelsStore.externalProvider = next
      modelsStore.loadExternalModels()
    }
  },
  { immediate: true }
)

watch(
  () => settingsStore.configuredProviders.find((p) => p.instanceId === form.provider),
  async (provider) => {
    if (!provider) return
    capabilities.value = await modelsStore.getCapabilities(form.provider)
  }
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
    if (loading || !isLocalProvider(form.provider) || form.models.length > 0) return
    const loaded = installedModels.value.find((m) => m.loaded)
    if (loaded) form.models = [{ source: 'installed', modelKey: loaded.key }]
  }
)

const installedModels = computed(() => {
  if (isLocalProvider(form.provider)) {
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
  emit(
    'submit',
    {
      suiteId: form.suiteId,
      provider: form.provider,
      models: form.models,
      deleteAutoDownloadedModels: form.deleteAutoDownloadedModels,
      unloadModelsAfterRun: capabilities.value?.loadModel ? form.unloadModelsAfterRun : undefined,
      parallelRun:
        capabilities.value && !capabilities.value.localModels ? form.parallelRun : undefined
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

    <Field v-if="allProviderOptions.length > 0" label="Provider">
      <div class="provider-groups">
        <div v-if="localProviderOptions.length > 0" class="provider-group">
          <span class="group-label">Local</span>
          <RadioGroup v-model="form.provider" :options="localProviderOptions" />
        </div>
        <div v-if="externalProviderOptions.length > 0" class="provider-group">
          <span class="group-label">External</span>
          <RadioGroup v-model="form.provider" :options="externalProviderOptions" />
        </div>
      </div>
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
        <label v-if="capabilities?.loadModel" class="toggle-row">
          <span class="toggle-label">Unload models after run</span>
          <Toggle v-model="form.unloadModelsAfterRun" :disabled="form.deleteAutoDownloadedModels" />
        </label>
        <label v-if="capabilities?.downloadModel && capabilities.deleteModel" class="toggle-row">
          <span class="toggle-label">Delete auto-downloaded models after run</span>
          <Toggle v-model="form.deleteAutoDownloadedModels" />
        </label>

        <label v-if="capabilities && !capabilities.localModels" class="toggle-row">
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

.provider-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.provider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: 500;
  min-width: 52px;
  flex-shrink: 0;
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
