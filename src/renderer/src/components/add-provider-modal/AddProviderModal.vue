<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Component } from 'vue'
import {
  IconServer,
  IconCode,
  IconCloud,
  IconCircleCheck,
  IconCircleX,
  IconX
} from '@tabler/icons-vue'
import Modal from '@renderer/components/ui/Modal.vue'
import Button from '@renderer/components/ui/Button.vue'
import Field from '@renderer/components/ui/Field.vue'
import Input from '@renderer/components/ui/Input.vue'
import Toggle from '@renderer/components/ui/Toggle.vue'
import AddProviderModalTypeCard from './AddProviderModalTypeCard.vue'
import { useProvidersStore } from '@renderer/stores/providers'
import { api } from '@renderer/api'
import type { SecretSource } from '@shared/provider/api-key'
import {
  KNOWN_PROVIDER_DEFAULTS,
  type ProviderType,
  type ConfiguredProvider
} from '@shared/provider/configured-provider'
import { createLogger } from '@renderer/utils/logger'

const log = createLogger('add-provider-modal')

function iconFor(type: ProviderType, isExternal: boolean): Component {
  if (type === 'custom') return IconCode
  if (isExternal) return IconCloud
  return IconServer
}

const knownProviders = computed(() =>
  Object.entries(KNOWN_PROVIDER_DEFAULTS).map(([type, def]) => ({
    type: type as ProviderType,
    ...def
  }))
)

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

const apiKeyState = reactive(emptyApiKeyState())

function emptyApiKeyState(): {
  value: string
  source: SecretSource
  preview: string
  dirty: boolean
  cleared: boolean
  envLabel: string
} {
  return { value: '', source: 'none', preview: '', dirty: false, cleared: false, envLabel: '' }
}

const isEditMode = computed(() => !!props.editProvider)

const existingTypes = computed(() => new Set(providers.configuredProviders.map((p) => p.type)))

const selectedDefinition = computed(() => KNOWN_PROVIDER_DEFAULTS[selectedType.value])

const apiKeyHint = computed(() => {
  const envPart = apiKeyState.envLabel
    ? ` Alternatively, set the ${apiKeyState.envLabel} environment variable.`
    : ''
  const base = `Stored securely on this device.${envPart}`
  return selectedDefinition.value.requiresApiKey ? base : `Optional. ${base}`
})

const apiKeySatisfied = computed(() => {
  if (!selectedDefinition.value.requiresApiKey) return true
  return apiKeyState.source !== 'none' || apiKeyState.value.trim().length > 0
})

const canAdd = computed(
  () => displayName.value.trim().length > 0 && url.value.trim().length > 0 && apiKeySatisfied.value
)

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
      loadSecretInfo(provider.type)
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
  void loadSecretInfo(type)
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
  } catch (e) {
    log.debug(`Connection test failed for ${selectedType.value}:`, e)
    connectionStatus.value = 'error'
  }
}

async function loadSecretInfo(type: ProviderType): Promise<void> {
  apiKeyState.value = ''
  apiKeyState.dirty = false
  apiKeyState.cleared = false
  const status = await api.getSecretInfo(type)
  apiKeyState.source = status.source
  apiKeyState.preview = status.preview ?? ''
  apiKeyState.envLabel = status.envName
}

function clearApiKey(): void {
  apiKeyState.value = ''
  apiKeyState.preview = ''
  apiKeyState.source = 'none'
  apiKeyState.dirty = true
  apiKeyState.cleared = true
}

async function persistApiKey(): Promise<void> {
  if (!apiKeyState.dirty) return
  const value = apiKeyState.value.trim()
  if (value.length > 0) {
    await api.setSecret(selectedType.value, value)
  } else if (apiKeyState.cleared) {
    await api.deleteSecret(selectedType.value)
  }
}

async function addProvider(): Promise<void> {
  const provider: ConfiguredProvider = {
    instanceId: crypto.randomUUID(),
    type: selectedType.value,
    displayName: displayName.value.trim(),
    url: url.value.trim(),
    isDefault: false,
    ...(selectedDefinition.value.supportsRemote && { isRemote: isRemote.value })
  }

  await persistApiKey()
  await providers.addProvider(provider)
  model.value = false
  reset()
}

async function saveProvider(): Promise<void> {
  if (!props.editProvider) return
  await persistApiKey()
  await providers.updateProvider({
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
  Object.assign(apiKeyState, emptyApiKeyState())
}

function onClose(): void {
  if (!isEditMode.value) reset()
}
</script>

<template>
  <Modal
    v-model="model"
    :title="modalTitle"
    hint="A provider is a local or external LLM server that Cannonade sends test prompts to."
    size="sm"
    :close-on-backdrop="true"
    @update:model-value="onClose"
  >
    <div v-if="step === 1" class="type-list">
      <AddProviderModalTypeCard
        v-for="provider in knownProviders"
        :key="provider.type"
        :icon="iconFor(provider.type, provider.isExternal)"
        :label="provider.displayName"
        :description="provider.description"
        :disabled="isDisabled(provider.type)"
        @click="selectType(provider.type)"
      />
    </div>

    <div v-else class="form">
      <Field label="Name">
        <Input v-model="displayName" placeholder="My Provider" :maxlength="25" />
      </Field>
      <Field
        label="URL"
        hint="The address where your provider is running. Provider's API endpoint."
      >
        <Input v-model="url" placeholder="http://localhost:1234" type="url" />
      </Field>

      <Field label="API Key" :hint="apiKeyHint">
        <div class="api-key-input">
          <Input v-if="apiKeyState.source === 'env'" :model-value="apiKeyState.preview" disabled />
          <Input
            v-else
            v-model="apiKeyState.value"
            type="password"
            :placeholder="apiKeyState.source === 'store' ? apiKeyState.preview : 'Enter API key'"
            @update:model-value="apiKeyState.dirty = true"
          />
          <Button
            v-if="apiKeyState.source === 'store'"
            v-tooltip="'Clear saved key'"
            type="icon"
            :icon="IconX"
            :icon-size="13"
            class="api-key-clear-btn"
            @click="clearApiKey"
          />
        </div>
      </Field>

      <Field
        v-if="selectedDefinition.supportsRemote"
        label="Remote server"
        inline
        hint="Enable if this provider is served on your network, not on this machine."
      >
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
      <Button
        v-if="step === 2 && isEditMode"
        type="primary"
        :disabled="!canAdd"
        @click="saveProvider"
      >
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

.api-key-input {
  position: relative;

  :deep(.input) {
    padding-right: 28px;
  }
}

.api-key-clear-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
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
