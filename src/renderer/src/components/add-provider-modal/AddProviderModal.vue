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
import RadioGroup from '@renderer/components/ui/RadioGroup.vue'
import AddProviderModalTypeCard from './AddProviderModalTypeCard.vue'
import { useProvidersStore } from '@renderer/stores/providers'
import { api } from '@renderer/api'
import type { ProbeAuth } from '@shared/provider/api-key'
import {
  KNOWN_PROVIDER_DEFAULTS,
  defaultEnvVarName,
  type ProviderType,
  type ProviderAuthMethod,
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
const selectedType = ref<ProviderType>('custom')
const displayName = ref('')
const url = ref('')
const isRemote = ref(false)
const connectionStatus = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')
const authMethod = ref<ProviderAuthMethod>('none')
const envVarName = ref('')

const apiKeyState = reactive(emptyApiKeyState())

function emptyApiKeyState(): {
  value: string
  storedKeyExists: boolean
  maskedStoredKey: string
  envVarExists: boolean
  maskedEnvValue: string
  dirty: boolean
  cleared: boolean
} {
  return {
    value: '',
    storedKeyExists: false,
    maskedStoredKey: '',
    envVarExists: false,
    maskedEnvValue: '',
    dirty: false,
    cleared: false
  }
}

const isEditMode = computed(() => !!props.editProvider)

const existingTypes = computed(() => new Set(providers.configuredProviders.map((p) => p.type)))

const selectedDefinition = computed(() => KNOWN_PROVIDER_DEFAULTS[selectedType.value])

const authMethodOptions = computed<{ value: ProviderAuthMethod; label: string }[]>(() => [
  ...(selectedDefinition.value.requiresApiKey
    ? []
    : [{ value: 'none' as ProviderAuthMethod, label: 'None' }]),
  { value: 'stored' as ProviderAuthMethod, label: 'API Key' },
  { value: 'env' as ProviderAuthMethod, label: 'Environment Variable' }
])

function defaultAuthMethod(type: ProviderType): ProviderAuthMethod {
  return KNOWN_PROVIDER_DEFAULTS[type].requiresApiKey ? 'stored' : 'none'
}

const apiKeyHint = computed(() => {
  const base = 'Stored securely on this device.'
  return selectedDefinition.value.requiresApiKey ? base : `Optional. ${base}`
})

const apiKeySatisfied = computed(() => {
  if (!selectedDefinition.value.requiresApiKey) return true
  if (authMethod.value === 'env') return apiKeyState.envVarExists
  if (authMethod.value === 'stored') {
    return (
      (apiKeyState.storedKeyExists && !apiKeyState.cleared) || apiKeyState.value.trim().length > 0
    )
  }
  return false
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
      authMethod.value = provider.authMethod ?? defaultAuthMethod(provider.type)
      envVarName.value = provider.envVarName ?? defaultEnvVarName(provider.type)
      step.value = 2
      connectionStatus.value = 'idle'
      void refreshSecretInfo()
    } else {
      reset()
    }
  },
  { immediate: true }
)

watch(envVarName, () => {
  void refreshSecretInfo()
})

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
  authMethod.value = defaultAuthMethod(type)
  envVarName.value = defaultEnvVarName(type)
  step.value = 2
  void refreshSecretInfo()
}

function goBack(): void {
  step.value = 1
  connectionStatus.value = 'idle'
}

function probeAuth(): ProbeAuth {
  if (authMethod.value === 'env') {
    return { authMethod: 'env', envVarName: envVarName.value.trim() }
  }
  if (authMethod.value === 'stored') {
    return { authMethod: 'stored', instanceId: props.editProvider?.instanceId }
  }
  return { authMethod: 'none' }
}

async function testConnection(): Promise<void> {
  connectionStatus.value = 'testing'
  try {
    const ok = await api.testConnectionUrl(selectedType.value, url.value, probeAuth())
    connectionStatus.value = ok ? 'ok' : 'error'
  } catch (e) {
    log.debug(`Connection test failed for ${selectedType.value}:`, e)
    connectionStatus.value = 'error'
  }
}

async function refreshSecretInfo(): Promise<void> {
  const name = envVarName.value.trim() || defaultEnvVarName(selectedType.value)
  const info = await api.getSecretInfo(name, props.editProvider?.instanceId ?? null)
  apiKeyState.envVarExists = info.envVarExists
  apiKeyState.maskedEnvValue = info.maskedEnvValue ?? ''
  if (!apiKeyState.cleared) {
    apiKeyState.storedKeyExists = info.storedKeyExists
    apiKeyState.maskedStoredKey = info.maskedStoredKey ?? ''
  }
}

function clearApiKey(): void {
  apiKeyState.value = ''
  apiKeyState.storedKeyExists = false
  apiKeyState.maskedStoredKey = ''
  apiKeyState.dirty = true
  apiKeyState.cleared = true
}

async function persistApiKey(instanceId: string): Promise<void> {
  if (authMethod.value !== 'stored' || !apiKeyState.dirty) return
  const value = apiKeyState.value.trim()
  if (value.length > 0) {
    await api.setSecret(instanceId, value)
  } else if (apiKeyState.cleared) {
    await api.deleteSecret(instanceId)
  }
}

async function addProvider(): Promise<void> {
  const provider: ConfiguredProvider = {
    instanceId: crypto.randomUUID(),
    type: selectedType.value,
    displayName: displayName.value.trim(),
    url: url.value.trim(),
    isDefault: false,
    authMethod: authMethod.value,
    envVarName: authMethod.value === 'env' ? envVarName.value.trim() : undefined,
    ...(selectedDefinition.value.supportsRemote && { isRemote: isRemote.value })
  }

  await persistApiKey(provider.instanceId)
  await providers.addProvider(provider)
  model.value = false
  reset()
}

async function saveProvider(): Promise<void> {
  if (!props.editProvider) return
  await persistApiKey(props.editProvider.instanceId)
  await providers.updateProvider({
    ...props.editProvider,
    displayName: displayName.value.trim(),
    url: url.value.trim(),
    authMethod: authMethod.value,
    envVarName: authMethod.value === 'env' ? envVarName.value.trim() : undefined,
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
  authMethod.value = 'none'
  envVarName.value = ''
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

      <Field
        label="Authentication"
        hint="How this provider authenticates: no API key, a stored key, or an environment variable."
      >
        <RadioGroup v-model="authMethod" :options="authMethodOptions" type="rounded" />
      </Field>

      <Field v-if="authMethod === 'stored'" label="API Key" :hint="apiKeyHint">
        <div class="api-key-input">
          <Input
            v-model="apiKeyState.value"
            type="password"
            :placeholder="
              apiKeyState.storedKeyExists && !apiKeyState.cleared
                ? apiKeyState.maskedStoredKey
                : 'Enter API key'
            "
            @update:model-value="apiKeyState.dirty = true"
          />
          <Button
            v-if="apiKeyState.storedKeyExists && !apiKeyState.cleared"
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
        v-else-if="authMethod === 'env'"
        label="Environment Variable"
        hint="Name of the environment variable that holds the API key."
      >
        <Input v-model="envVarName" placeholder="MY_PROVIDER_API_KEY" spellcheck="false" />
        <span v-if="apiKeyState.envVarExists" class="env-status env-status--ok">
          <IconCircleCheck :size="13" />
          Set ({{ apiKeyState.maskedEnvValue }})
        </span>
        <span v-else class="env-status env-status--warn">
          <IconCircleX :size="13" />
          Not set in current environment
        </span>
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

.env-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: var(--text-xs);

  &--ok {
    color: var(--success, #4ade80);
  }

  &--warn {
    color: var(--text-muted);
  }
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
