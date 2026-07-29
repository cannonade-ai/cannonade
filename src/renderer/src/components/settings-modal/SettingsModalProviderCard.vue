<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconStar, IconStarFilled, IconTrash, IconPencil } from '@tabler/icons-vue'
import Button from '@renderer/components/ui/Button.vue'
import SettingsModalProviderCardServerStatus from './SettingsModalProviderCardServerStatus.vue'
import { useProvidersStore } from '@renderer/stores/providers'
import { useConfirmStore } from '@renderer/stores/confirm'
import { api } from '@renderer/api'
import type { ConfiguredProvider } from '@shared/provider/configured-provider'

const props = defineProps<{
  provider: ConfiguredProvider
  showSetDefault: boolean
}>()

const emit = defineEmits<{
  edit: [provider: ConfiguredProvider]
}>()

const providers = useProvidersStore()
const confirm = useConfirmStore()

const serverControl = ref(false)

async function remove(): Promise<void> {
  const ok = await confirm.confirm({
    title: 'Remove Provider',
    message: `Remove "${props.provider.displayName}"? This will not affect any saved test runs.`,
    confirmText: 'Remove',
    danger: true
  })
  if (ok) await providers.removeProvider(props.provider.instanceId)
}

function setDefault(): void {
  providers.setDefault(props.provider.instanceId)
}

onMounted(async () => {
  const capabilities = await api.getCapabilities(props.provider.instanceId)
  serverControl.value = capabilities.serverControl
})
</script>

<template>
  <div class="provider-card">
    <div class="provider-card__main">
      <div class="provider-card__header">
        <span class="provider-card__name">{{ provider.displayName }}</span>
        <span class="provider-card__type">{{ props.provider.type }}</span>
        <span v-if="provider.isDefault" class="provider-card__default">
          <IconStarFilled :size="11" />
          Default
        </span>
      </div>
      <span class="provider-card__url">{{ provider.url }}</span>

      <SettingsModalProviderCardServerStatus
        v-if="serverControl && !provider.isRemote"
        :instance-id="provider.instanceId"
      />
    </div>

    <div class="provider-card__actions">
      <Button
        v-if="showSetDefault && !provider.isDefault"
        type="icon"
        :icon="IconStar"
        :icon-size="15"
        @click="setDefault"
      />
      <Button
        v-tooltip="'Edit provider'"
        type="icon"
        :icon="IconPencil"
        :icon-size="15"
        @click="emit('edit', provider)"
      />
      <Button
        v-tooltip="'Remove provider'"
        type="icon"
        :icon="IconTrash"
        :icon-size="15"
        @click="remove"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.provider-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__type {
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1px 6px;
  }

  &__default {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--accent);
  }

  &__url {
    font-size: var(--text-xs);
    font-family: var(--font-mono, monospace);
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
}
</style>
