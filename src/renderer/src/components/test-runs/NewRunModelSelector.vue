<script setup lang="ts">
import { Badge, ExternalLink, InfoTooltip, Input } from '@renderer/components/ui'
import type { ModelRef } from '@shared/app/test-run'
import {
  IconLoader2,
  IconPlus,
  IconCloudDownload,
  IconCircleCheck,
  IconPackageImport,
  IconCloudComputing,
  type Icon
} from '@tabler/icons-vue'
import { useProvidersStore } from '@renderer/stores/providers'
import { matchesHfModelId } from '@shared/provider/hf-model-match'
import { computed, ref } from 'vue'

export interface InstalledModelOption {
  key: string
  label: string
  loaded: boolean
  quantization?: string
}

const props = defineProps<{
  modelValue: ModelRef[]
  installedModels: InstalledModelOption[]
  loadingModels: boolean
  loadFailed: boolean
  external?: boolean
}>()

const providersStore = useProvidersStore()

const hfUrl = computed<string>(() => providersStore.activeCapabilities?.huggingFaceModelsUrl ?? '')
const registryUrl = computed<string>(
  () => providersStore.activeCapabilities?.modelRegistryUrl ?? ''
)

const emit = defineEmits<{
  'update:model-value': [models: ModelRef[]]
}>()

const searchInput = ref('')

const sortedInstalledModels = computed<typeof props.installedModels>(() => {
  const sorted = [...props.installedModels].sort((a, b) => Number(b.loaded) - Number(a.loaded))
  const query = searchInput.value.trim().toLowerCase()
  if (!props.external || !query) return sorted
  return sorted.filter(
    (m) => m.label.toLowerCase().includes(query) || m.key.toLowerCase().includes(query)
  )
})

const hfInput = ref('')
const registryInput = ref('')

function refKey(m: ModelRef): string {
  return m.source === 'installed' ? m.modelKey : m.modelId
}

function toModelRef(key: string): ModelRef {
  return props.external
    ? { source: 'external', modelId: key }
    : { source: 'installed', modelKey: key }
}

function isChecked(key: string): boolean {
  const source = props.external ? 'external' : 'installed'
  return props.modelValue.some((m) => m.source === source && refKey(m) === key)
}

function toggleInstalled(key: string): void {
  const source = props.external ? 'external' : 'installed'
  const without = props.modelValue.filter((m) => !(m.source === source && refKey(m) === key))
  if (without.length === props.modelValue.length) {
    emit('update:model-value', [...props.modelValue, toModelRef(key)])
  } else {
    emit('update:model-value', without)
  }
}

function addHuggingFaceModel(): void {
  const raw = hfInput.value.trim()
  const id = raw.includes('https://') ? raw.split('/').slice(-2).join('/') : raw
  if (!id) return
  const installedMatch = props.installedModels.find((m) => matchesHfModelId(m.key, id))
  if (installedMatch) {
    if (!isChecked(installedMatch.key)) toggleInstalled(installedMatch.key)
    hfInput.value = ''
    return
  }
  if (props.modelValue.some((m) => m.source === 'huggingface' && m.modelId === id)) return
  emit('update:model-value', [...props.modelValue, { source: 'huggingface', modelId: id }])
  hfInput.value = ''
}

function addRegistryModel(): void {
  const id = registryInput.value.trim()
  if (!id) return
  if (props.installedModels.some((m) => m.key === id)) {
    if (!isChecked(id)) toggleInstalled(id)
    registryInput.value = ''
    return
  }
  if (props.modelValue.some((m) => m.source === 'registry' && m.modelId === id)) return
  emit('update:model-value', [...props.modelValue, { source: 'registry', modelId: id }])
  registryInput.value = ''
}

function badgeIcon(ref: ModelRef): Icon {
  if (ref.source === 'installed') return IconCircleCheck
  if (ref.source === 'registry') return IconPackageImport
  if (ref.source === 'external') return IconCloudComputing
  return IconCloudDownload
}

function removeModel(index: number): void {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:model-value', next)
}

function modelChipLabel(ref: ModelRef): string {
  return ref.source === 'installed' ? ref.modelKey : ref.modelId
}
</script>

<template>
  <div class="model-selector">
    <div v-if="modelValue.length > 0" class="selected-chips">
      <Badge
        v-for="(m, i) in modelValue"
        :key="`${m.source}:${refKey(m)}`"
        :type="m.source === 'installed' ? 'secondary' : 'default'"
        :icon="badgeIcon(m)"
        removable
        @remove="removeModel(i)"
      >
        {{ modelChipLabel(m) }}
      </Badge>
    </div>
    <div v-else class="selected-chips">
      <span class="chip">No models selected</span>
    </div>

    <div class="sub-section">
      <div class="sub-label-row">
        <span class="sub-label">{{ external ? 'Available Models' : 'Installed Models' }}</span>
        <IconLoader2 v-if="loadingModels" class="spinner" :size="12" :stroke-width="2" />
      </div>
      <Input
        v-if="external && installedModels.length > 0"
        v-model="searchInput"
        type="search"
        placeholder="Search models…"
      />
      <div v-if="!loadingModels && installedModels.length === 0" class="empty-hint">
        {{ external ? 'No models found.' : 'No installed models found.' }}
      </div>
      <div
        v-else-if="installedModels.length > 0 && sortedInstalledModels.length === 0"
        class="empty-hint"
      >
        No models match your search.
      </div>
      <ul v-else-if="installedModels.length > 0" class="installed-list">
        <li
          v-for="m in sortedInstalledModels"
          :key="m.key"
          class="installed-item"
          :class="{ checked: isChecked(m.key) }"
          @click="toggleInstalled(m.key)"
        >
          <span class="checkbox" :class="{ checked: isChecked(m.key) }">
            <svg v-if="isChecked(m.key)" width="10" height="10" viewBox="0 0 10 10">
              <polyline
                points="1.5,5 4,7.5 8.5,2.5"
                stroke="currentColor"
                stroke-width="1.5"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="installed-label">{{ m.label }}</span>
          <span v-if="m.quantization" class="installed-quant">{{ m.quantization }}</span>
          <Badge v-if="m.loaded" class="loaded-badge" type="success"> Loaded </Badge>
        </li>
      </ul>
    </div>

    <div v-if="!external" class="sub-section">
      <span class="sub-label-row">
        <span class="sub-label">Registry Model</span>
        <InfoTooltip interactive>
          <p class="hf-tooltip__text">
            Pull a model directly from the provider's own registry
            <ExternalLink v-if="registryUrl" :href="registryUrl" :icon="false">
              {{ registryUrl.replace('https://', '').trim() }}.
            </ExternalLink>
            Paste the model name exactly as the provider lists it (e.g. publisher/model-name).
          </p>
        </InfoTooltip>
      </span>
      <div class="hf-input-row">
        <Input
          v-model="registryInput"
          placeholder="publisher/model-name"
          :disabled="!registryUrl || loadFailed"
          @submit="addRegistryModel"
        />
        <button
          class="btn-add-hf"
          :disabled="!registryUrl || loadFailed || !registryInput.trim()"
          @click="addRegistryModel"
        >
          <IconPlus :size="13" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <div v-if="!external" class="sub-section">
      <span class="sub-label-row">
        <span class="sub-label">HuggingFace Model</span>
        <InfoTooltip interactive>
          <p class="hf-tooltip__text">
            Search
            <ExternalLink :href="hfUrl ? hfUrl : 'https://huggingface.co/models'" :icon="false">
              huggingface.co
            </ExternalLink>
            for a model, then paste either its ID (publisher/model-name) or its model card URL.
          </p>
          <ExternalLink class="hf-tooltip__docs" href="#">Docs</ExternalLink>
        </InfoTooltip>
      </span>
      <div class="hf-input-row">
        <Input
          v-model="hfInput"
          placeholder="publisher/model-name or model card URL"
          :disabled="!hfUrl || loadFailed"
          @submit="addHuggingFaceModel"
        />
        <button
          class="btn-add-hf"
          :disabled="!hfUrl || loadFailed || !hfInput.trim()"
          @click="addHuggingFaceModel"
        >
          <IconPlus :size="13" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.model-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .badge {
    padding: 4px 8px;
  }
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: 4px 8px;
}

.sub-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.spinner {
  color: var(--text-muted);
  animation: spin 1s linear infinite;
}

.empty-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: 6px 0;
}

.installed-list {
  list-style: none;
  border: 1px solid var(--border);
  max-height: 160px;
  overflow-y: auto;
}

.installed-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background-color 0.1s;
  border-bottom: 1px solid var(--border);
}

.installed-item:last-child {
  border-bottom: none;
}

.installed-item:hover {
  background-color: var(--surface-hover);
}

.installed-item.checked {
  background-color: var(--accent-bg);
}

.loaded-badge {
  margin-left: auto;
}

.checkbox {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--border-hover);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.1s,
    border-color 0.1s;
}

.checkbox.checked {
  background-color: var(--accent);
  border-color: var(--accent);
  color: #000;
}

.installed-label {
  font-size: var(--text-xs);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.installed-quant {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.hf-input-row {
  display: flex;
  gap: 6px;

  :deep(.input) {
    flex: 1;
  }
}

.hf-tooltip__text {
  margin: 0 0 6px;
}

.hf-tooltip__docs {
  font-weight: 600;
}

.btn-add-hf {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.btn-add-hf:hover:not(:disabled) {
  background: rgba(255, 179, 0, 0.3);
}

.btn-add-hf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
