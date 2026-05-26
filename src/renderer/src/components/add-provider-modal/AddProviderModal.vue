<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Component } from 'vue'
import { IconServer, IconCode, IconCircleCheck, IconCircleX } from '@tabler/icons-vue'
import Modal from '@renderer/components/ui/Modal.vue'
import Button from '@renderer/components/ui/Button.vue'
import Field from '@renderer/components/ui/Field.vue'
import Input from '@renderer/components/ui/Input.vue'
import Toggle from '@renderer/components/ui/Toggle.vue'
import AddProviderModalTypeCard from './AddProviderModalTypeCard.vue'
import { useProvidersStore } from '@renderer/stores/providers'
import { api } from '@renderer/api'
import {
  KNOWN_PROVIDER_DEFAULTS,
  type ProviderType,
  type ConfiguredProvider
} from '@shared/provider/configured-provider'

const TYPE_ICONS: Record<string, Component> = {
  lmstudio: IconServer,
  ollama: IconServer,
  custom: IconCode
}

const providerEntries = Object.entries(KNOWN_PROVIDER_DEFAULTS) as Array<
  [ProviderType, (typeof KNOWN_PROVIDER_DEFAULTS)[ProviderType]]
>

const model = defineModel<boolean>({ required: true })

const props = defineProps<{
  editProvider?: ConfiguredProvider
}>()

const providers = useProvidersStore()

const step = ref<1 | 2>(1)
const selectedType = ref<ProviderType>('lmstudio')
const displayName = ref('')
const url = ref('')
const isRemote = ref(false)
const connectionStatus = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')

const isEditMode = computed(() => !!props.editProvider)

const existingTypes = computed(() => new Set(providers.configuredProviders.map((p) => p.type)))

const canAdd = computed(() => displayName.value.trim().length > 0 && url.value.trim().length > 0)

const selectedDefinition = computed(() => KNOWN_PROVIDER_DEFAULTS[selectedType.value])

const modalTitle = computed(() => {
  if (isEditMode.value) return 'Edit Provider'
  return step.value === 1 ? 'Add Provider' : 'Configure Provider'
})

watch(
  () => props.editProvider,
  (provider) => {
    if (provider) {
      selectedType.value = provider.type
      displayName.value = provider.displayName
      url.value = provider.url
      isRemote.value = provider.isRemote ?? false
      step.value = 2
      connectionStatus.value = 'idle'
    } else {
      reset()
    }
  },
  { immediate: true }
)

function isDisabled(type: ProviderType): boolean {
  return KNOWN_PROVIDER_DEFAULTS[type].singleton && existingTypes.value.has(type)
}

function selectType(type: ProviderType): void {
  selectedType.value = type
  connectionStatus.value = 'idle'
  const defaults = KNOWN_PROVIDER_DEFAULTS[type]
  displayName.value = defaults.displayName
  url.value = defaults.defaultUrl
  isRemote.value = false
  step.value = 2
}

function goBack(): void {
  step.value = 1
  connectionStatus.value = 'idle'
}

async function testConnection(): Promise<void> {
  connectionStatus.value = 'testing'
  try {
    const ok = await api.testConnectionUrl(selectedType.value, url.value)
    connectionStatus.value = ok ? 'ok' : 'error'
  } catch {
    connectionStatus.value = 'error'
  }
}

function addProvider(): void {
  const provider: ConfiguredProvider = {
    instanceId: crypto.randomUUID(),
    type: selectedType.value,
    displayName: displayName.value.trim(),
    url: url.value.trim(),
    isDefault: false,
    ...(selectedDefinition.value.supportsRemote && { isRemote: isRemote.value })
  }

  providers.addProvider(provider)
  model.value = false
  reset()
}

function saveProvider(): void {
  if (!props.editProvider) return
  providers.updateProvider({
    ...props.editProvider,
    displayName: displayName.value.trim(),
    url: url.value.trim(),
    ...(selectedDefinition.value.supportsRemote && { isRemote: isRemote.value })
  })
  model.value = false
}

function reset(): void {
  step.value = 1
  selectedType.value = 'lmstudio'
  displayName.value = ''
  url.value = ''
  isRemote.value = false
  connectionStatus.value = 'idle'
}

function onClose(): void {
  if (!isEditMode.value) reset()
}
</script>

<template>
  <Modal
    v-model="model"
    :title="modalTitle"
    size="sm"
    :close-on-backdrop="true"
    @update:model-value="onClose"
  >
    <div v-if="step === 1" class="type-list">
      <AddProviderModalTypeCard
        v-for="[type, def] in providerEntries"
        :key="type"
        :icon="TYPE_ICONS[type] ?? IconCode"
        :label="def.displayName"
        :description="def.description"
        :disabled="isDisabled(type)"
        @click="selectType(type)"
      />
    </div>

    <div v-else class="form">
      <Field label="Name">
        <Input v-model="displayName" placeholder="My Provider" />
      </Field>
      <Field label="URL">
        <Input v-model="url" placeholder="http://localhost:1234" type="url" />
      </Field>

      <Field v-if="selectedDefinition.supportsRemote" label="Remote server">
        <Toggle v-model="isRemote" />
      </Field>

      <div class="connection-row">
        <Button :disabled="!canAdd || connectionStatus === 'testing'" @click="testConnection">
          Test Connection
        </Button>
        <span v-if="connectionStatus === 'ok'" class="status status--ok">
          <IconCircleCheck :size="14" />
          Connected
        </span>
        <span v-else-if="connectionStatus === 'error'" class="status status--error">
          <IconCircleX :size="14" />
          Failed
        </span>
      </div>
    </div>

    <template #actions>
      <Button v-if="step === 2 && !isEditMode" @click="goBack">Back</Button>
      <Button v-else @click="model = false">Cancel</Button>
      <Button v-if="step === 2 && isEditMode" type="primary" :disabled="!canAdd" @click="saveProvider">
        Save
      </Button>
      <Button v-else-if="step === 2" type="primary" :disabled="!canAdd" @click="addProvider">
        Add Provider
      </Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.connection-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 500;

  &--ok {
    color: var(--success, #4ade80);
  }

  &--error {
    color: var(--error);
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
