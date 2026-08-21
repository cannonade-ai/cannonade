<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { IconLayoutList } from '@tabler/icons-vue'
import { Button, Toggle } from '@renderer/components/ui'
import { useSettingsStore } from '@renderer/stores/settings'
import { FIELD_VISIBILITY_LABELS, type FieldVisibility } from '@shared/app/field-visibility'

const settings = useSettingsStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const fieldKeys = Object.keys(FIELD_VISIBILITY_LABELS) as (keyof FieldVisibility)[]

function toggleField(key: keyof FieldVisibility, value: boolean): void {
  settings.fieldVisibility[key] = value
}

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="root" class="fields-menu">
    <Button
      v-tooltip="'Visible case details'"
      type="secondary"
      :icon="IconLayoutList"
      @click="open = !open"
    >
      Fields
    </Button>

    <div v-if="open" class="fields-menu__dropdown">
      <label v-for="key in fieldKeys" :key="key" class="fields-menu__item">
        <span>{{ FIELD_VISIBILITY_LABELS[key] }}</span>
        <Toggle
          :model-value="settings.fieldVisibility[key]"
          @update:model-value="toggleField(key, $event)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fields-menu {
  position: relative;

  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 100;
    min-width: 12rem;
    padding: 4px;
    display: flex;
    flex-direction: column;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 12px var(--shadow);
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 8px;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);

    &:hover {
      background: var(--surface-hover);
    }
  }
}
</style>
