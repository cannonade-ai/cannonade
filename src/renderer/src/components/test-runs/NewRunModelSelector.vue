<script setup lang="ts">
import { Badge, Input } from '@renderer/components/ui'
import type { ModelRef } from '@shared/app/test-run'
import { IconLoader2, IconPlus, IconCloudDownload, IconCircleCheck } from '@tabler/icons-vue'
import { ref } from 'vue'

const props = defineProps<{
  modelValue: ModelRef[]
  installedModels: Array<{ key: string; label: string; loaded: boolean }>
  loadingModels: boolean
}>()

const emit = defineEmits<{
  'update:model-value': [models: ModelRef[]]
}>()

const hfInput = ref('')

function isChecked(key: string): boolean {
  return props.modelValue.some((m) => m.source === 'installed' && m.modelKey === key)
}

function toggleInstalled(key: string): void {
  const without = props.modelValue.filter((m) => !(m.source === 'installed' && m.modelKey === key))
  if (without.length === props.modelValue.length) {
    emit('update:model-value', [...props.modelValue, { source: 'installed', modelKey: key }])
  } else {
    emit('update:model-value', without)
  }
}

function addHuggingFace(): void {
  const raw = hfInput.value.trim()
  const id = raw.includes('https://') ? raw.split('/').slice(-2).join('/') : raw
  if (!id) return
  if (props.modelValue.some((m) => m.source === 'huggingface' && m.modelId === id)) return
  emit('update:model-value', [...props.modelValue, { source: 'huggingface', modelId: id }])
  hfInput.value = ''
}

function removeModel(index: number): void {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:model-value', next)
}

function modelChipLabel(ref: ModelRef): string {
  return ref.source === 'installed' ? ref.modelKey : ref.modelId
}

function onHfKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    addHuggingFace()
  }
}
</script>

<template>
  <div class="model-selector">
    <div v-if="modelValue.length > 0" class="selected-chips">
      <Badge
        v-for="(m, i) in modelValue"
        :key="i"
        :type="m.source === 'installed' ? 'secondary' : 'default'"
        :icon="m.source === 'installed' ? IconCircleCheck : IconCloudDownload"
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
        <span class="sub-label">Installed Models</span>
        <IconLoader2 v-if="loadingModels" class="spinner" :size="12" :stroke-width="2" />
      </div>
      <div v-if="!loadingModels && installedModels.length === 0" class="empty-hint">
        No installed models found.
      </div>
      <ul v-else-if="installedModels.length > 0" class="installed-list">
        <li
          v-for="m in installedModels"
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
          <Badge v-if="m.loaded" class="loaded-badge" type="success"> Loaded </Badge>
        </li>
      </ul>
    </div>

    <div class="sub-section">
      <span class="sub-label">HuggingFace Model</span>
      <div class="hf-input-row">
        <Input v-model="hfInput" placeholder="publisher/model-name" @keydown="onHfKeydown" />
        <button class="btn-add-hf" :disabled="!hfInput.trim()" @click="addHuggingFace">
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

.hf-input-row {
  display: flex;
  gap: 6px;

  :deep(.input) {
    flex: 1;
  }
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
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
