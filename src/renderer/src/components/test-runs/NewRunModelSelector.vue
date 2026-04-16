<script setup lang="ts">
import { ref } from 'vue'
import { IconPlus, IconX } from '@tabler/icons-vue'
import type { ModelRef } from '@shared/app/test-run'

const props = defineProps<{
  modelValue: ModelRef[]
  installedModels: Array<{ key: string; label: string }>
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
  const id = hfInput.value.trim()
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
      <span
        v-for="(m, i) in modelValue"
        :key="i"
        class="chip"
        :class="m.source"
      >
        <span class="chip-label">{{ modelChipLabel(m) }}</span>
        <button class="chip-remove" @click="removeModel(i)">
          <IconX :size="10" :stroke-width="2.5" />
        </button>
      </span>
    </div>

    <div class="sub-section">
      <span class="sub-label">Installed Models</span>
      <div v-if="loadingModels" class="loading-hint">Loading…</div>
      <div v-else-if="installedModels.length === 0" class="empty-hint">
        No installed models found.
      </div>
      <ul v-else class="installed-list">
        <li
          v-for="m in installedModels"
          :key="m.key"
          class="installed-item"
          :class="{ checked: isChecked(m.key) }"
          @click="toggleInstalled(m.key)"
        >
          <span class="checkbox" :class="{ checked: isChecked(m.key) }">
            <svg v-if="isChecked(m.key)" width="10" height="10" viewBox="0 0 10 10">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="installed-label">{{ m.label }}</span>
        </li>
      </ul>
    </div>

    <div class="sub-section">
      <span class="sub-label">HuggingFace Model</span>
      <div class="hf-input-row">
        <input
          v-model="hfInput"
          class="field-input"
          placeholder="publisher/model-name"
          @keydown="onHfKeydown"
        />
        <button class="btn-add-hf" :disabled="!hfInput.trim()" @click="addHuggingFace">
          <IconPlus :size="13" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 9px;
  font-size: 0.74rem;
  font-weight: 500;
  border-radius: var(--radius-full);
  max-width: 100%;
}

.chip.installed {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.chip.huggingface {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.chip-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.chip-remove {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;
}

.chip-remove:hover {
  opacity: 1;
}

.sub-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.loading-hint,
.empty-hint {
  font-size: 0.78rem;
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
  transition: background 0.1s;
  border-bottom: 1px solid var(--border);
}

.installed-item:last-child {
  border-bottom: none;
}

.installed-item:hover {
  background: var(--surface-hover);
}

.installed-item.checked {
  background: var(--accent-dim);
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
  transition: background 0.1s, border-color 0.1s;
}

.checkbox.checked {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
}

.installed-label {
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hf-input-row {
  display: flex;
  gap: 6px;
}

.field-input {
  flex: 1;
  padding: 6px 8px;
  font-size: 0.82rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus {
  border-color: var(--accent);
}

.btn-add-hf {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--accent-dim);
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
