<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { IconPlayerPlay } from '@tabler/icons-vue'
import type { Provider } from '@shared/provider-model-map'
import type { ModelRef, TestRunConfig } from '@shared/app/test-run'
import type { SuiteSummary } from '../../stores/test-runs'
import { useModelsStore } from '../../stores/models'
import NewRunModelSelector from './NewRunModelSelector.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseButton from '../BaseButton.vue'
import type { SelectOption } from '../BaseSelect.vue'

const props = defineProps<{
  suites: SuiteSummary[]
}>()

const emit = defineEmits<{
  cancel: []
  submit: [config: TestRunConfig, suiteName: string]
}>()

const modelsStore = useModelsStore()

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
  if (!canSubmit.value) return
  const suiteName = suiteOptions.value.find((o) => o.value === form.suiteId)?.label ?? ''
  emit(
    'submit',
    {
      suiteId: form.suiteId,
      provider: form.provider,
      models: form.models,
      deleteAutoDownloadedModels: form.deleteAutoDownloadedModels,
      parallelRun: form.provider === 'openrouter' ? form.parallelRun : undefined
    },
    suiteName
  )
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">New Run</span>
      <button class="btn-close" @click="emit('cancel')">
        <IconX :size="14" :stroke-width="2.5" />
      </button>
    </div>

    <div class="panel-body">
      <div class="field">
        <label class="field-label">Test Suite</label>
        <base-select v-model="form.suiteId" :options="suiteOptions" placeholder="Select a suite…" />
      </div>

      <div class="field">
        <label class="field-label">Provider</label>
        <div class="provider-options">
          <label class="provider-option" :class="{ active: form.provider === 'lmstudio' }">
            <input v-model="form.provider" type="radio" value="lmstudio" />
            LM Studio
          </label>
          <label class="provider-option" :class="{ active: form.provider === 'openrouter' }">
            <input v-model="form.provider" type="radio" value="openrouter" />
            OpenRouter
          </label>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Models</label>
        <NewRunModelSelector
          v-model="form.models"
          :installed-models="installedModels"
          :loading-models="modelsStore.loading"
        />
      </div>

      <div class="divider" />

      <div class="field">
        <label class="field-label">Options</label>
        <div class="options-list">
          <label v-if="form.provider === 'lmstudio'" class="toggle-row">
            <span class="toggle-label">Delete auto-downloaded models after run</span>
            <span class="toggle-wrap">
              <input
                v-model="form.deleteAutoDownloadedModels"
                type="checkbox"
                class="toggle-input"
              />
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
      </div>
    </div>

    <div class="panel-footer">
      <base-button @click="emit('cancel')">Cancel</base-button>
      <base-button type="primary" :icon="IconPlayerPlay" @click="onSubmit">Run</base-button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent-dim);
  background: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 3rem;
}

.panel-title {
  font-size: var(--text-xs);
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

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

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.provider-options {
  display: flex;
  gap: 8px;
}

.provider-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}

.provider-option input {
  display: none;
}

.provider-option.active {
  background: var(--accent-dim);
  border-color: var(--accent-border);
  color: var(--accent);
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

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-cancel,
.btn-run {
  padding: 6px 14px;
  font-size: var(--text-xs);
  font-weight: 500;
  font-family: var(--font-body);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.btn-cancel {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.btn-run {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.btn-run:hover:not(:disabled) {
  background: rgba(255, 179, 0, 0.3);
}

.btn-run:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
