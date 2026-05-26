<script setup lang="ts">
import { ref } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import Button from '@renderer/components/ui/Button.vue'
import { useSettingsStore } from '@renderer/stores/settings'
import SettingsModalProviderCard from './SettingsModalProviderCard.vue'
import AddProviderModal from '@renderer/components/add-provider-modal/AddProviderModal.vue'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'

const settings = useSettingsStore()
const addProviderOpen = ref(false)
const editingProvider = ref<ConfiguredProvider | undefined>(undefined)

function openEdit(provider: ConfiguredProvider): void {
  editingProvider.value = provider
  addProviderOpen.value = true
}

function onModalClose(open: boolean): void {
  if (!open) editingProvider.value = undefined
}
</script>

<template>
  <div class="providers">
    <div class="providers__toolbar">
      <Button type="primary" :icon="IconPlus" :icon-size="14" @click="addProviderOpen = true">
        Add Provider
      </Button>
    </div>

    <div v-if="settings.configuredProviders.length === 0" class="providers__empty">
      <p class="providers__empty-text">No providers configured.</p>
      <p class="providers__empty-hint">Add a provider to start running tests.</p>
    </div>

    <div v-else class="providers__list">
      <SettingsModalProviderCard
        v-for="provider in settings.configuredProviders"
        :key="provider.instanceId"
        :provider="provider"
        :show-set-default="settings.configuredProviders.length > 1"
        @edit="openEdit"
      />
    </div>

    <AddProviderModal
      v-model="addProviderOpen"
      :edit-provider="editingProvider"
      @update:model-value="onModalClose"
    />
  </div>
</template>

<style scoped lang="scss">
.providers {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__toolbar {
    display: flex;
    justify-content: flex-end;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 48px 24px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
    text-align: center;
  }

  &__empty-text {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  &__empty-hint {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin: 0;
  }
}
</style>
