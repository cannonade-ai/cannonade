<script setup lang="ts">
import { reactive, computed, watch, onMounted } from 'vue'
import { IconPlayerPlay } from '@tabler/icons-vue'
import type { Provider } from '@shared/provider-model-map'
import type { ModelRef, TestRunConfig } from '@shared/app/test-run'
import type { TestSuite } from '@shared/app/test-suite'
import { useModelsStore } from '@renderer/stores/models'
import { useSettingsStore } from '@renderer/stores/settings'
import NewRunModelSelector from '@renderer/components/test-runs/NewRunModelSelector.vue'
import BaseSelect from '@renderer/components/base/BaseSelect.vue'
import BaseButton from '@renderer/components/base/BaseButton.vue'
import BaseRadioGroup from '@renderer/components/base/BaseRadioGroup.vue'
import type { SelectOption } from '@renderer/components/base/BaseSelect.vue'
import BaseField from '@renderer/components/base/BaseField.vue'
import BasePanel from '@renderer/components/base/BasePanel.vue'

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
  provider: Provider
  models: ModelRef[]
  deleteAutoDownloadedModels: boolean
  parallelRun: boolean
}>({
  suiteId: '',
  provider: 'lmstudio',
  models: [],
  deleteAutoDownloadedModels: false,
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
    if (next === 'lmstudio') form.parallelRun = false
    modelsStore.provider = next
    modelsStore.load()
  },
  { immediate: true }
)

watch(
  () => modelsStore.loading,
  (loading) => {
    if (loading || form.provider !== 'lmstudio' || form.models.length > 0) return
    const loaded = installedModels.value.find((m) => m.loaded)
    if (loaded) form.models = [{ source: 'installed', modelKey: loaded.key }]
  }
)

const installedModels = computed(() => {
  if (form.provider === 'lmstudio') {
    return modelsStore.lmModels.map((m) => ({
      key: m.key,
      label: m.display_name,
      loaded: m.loaded_instances?.length > 0
    }))
  }
  return modelsStore.orModels.map((m) => ({ key: m.id, label: m.name, loaded: false }))
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
      parallelRun: form.provider === 'openrouter' ? form.parallelRun : undefined
    },
    suite
  )
}
</script>

<template>
  <base-panel title="New Run">
    <template #header-right>
      <button class="btn-close" @click="emit('cancel')">
        <IconX :size="14" :stroke-width="2.5" />
      </button>
    </template>

    <base-field label="Test Suite">
      <base-select v-model="form.suiteId" :options="suiteOptions" placeholder="Select a suite…" />
    </base-field>

    <base-field label="Provider">
      <base-radio-group
        v-model="form.provider"
        :options="[
          { value: 'lmstudio', label: 'LM Studio' },
          { value: 'openrouter', label: 'OpenRouter' }
        ]"
      />
    </base-field>

    <base-field label="Models">
      <NewRunModelSelector
        v-model="form.models"
        :installed-models="installedModels"
        :loading-models="modelsStore.loading"
      />
    </base-field>

    <div class="divider" />

    <base-field label="Options">
      <div class="options-list">
        <label v-if="form.provider === 'lmstudio'" class="toggle-row">
          <span class="toggle-label">Delete auto-downloaded models after run</span>
          <span class="toggle-wrap">
            <input v-model="form.deleteAutoDownloadedModels" type="checkbox" class="toggle-input" />
            <span class="toggle-track" />
          </span>
        </label>
        <label v-if="form.provider === 'openrouter'" class="toggle-row">
          <span class="toggle-label">Parallel run</span>
          <span class="toggle-wrap">
            <input v-model="form.parallelRun" type="checkbox" class="toggle-input" />
            <span class="toggle-track" />
          </span>
        </label>
      </div>
    </base-field>

    <template #footer>
      <base-button @click="emit('cancel')">Cancel</base-button>
      <base-button type="primary" :disabled="!canSubmit" :icon="IconPlayerPlay" @click="onSubmit">
        Run
      </base-button>
    </template>
  </base-panel>
</template>

<style scoped>
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
}

.btn-close:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
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
}

.toggle-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.toggle-wrap {
  position: relative;
  flex-shrink: 0;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  display: block;
  width: 32px;
  height: 18px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  transition:
    background 0.15s,
    border-color 0.15s;
  position: relative;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-muted);
  transition:
    transform 0.15s,
    background 0.15s;
}

.toggle-input:checked + .toggle-track {
  background: var(--accent-dim);
  border-color: var(--accent-border);
}

.toggle-input:checked + .toggle-track::after {
  transform: translateX(14px);
  background: var(--accent);
}
</style>
