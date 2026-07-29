<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '@renderer/api'
import { useSettingsStore } from '@renderer/stores/settings'
import { useProvidersStore } from '@renderer/stores/providers'
import { KNOWN_PROVIDER_DEFAULTS } from '@shared/provider/configured-provider'
import NumberInput from '@renderer/components/ui/NumberInput.vue'
import Select, { type SelectOption } from '@renderer/components/ui/Select.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'
import { createLogger } from '@renderer/utils/logger'

const log = createLogger('settings-judge')

const settings = useSettingsStore()
const providersStore = useProvidersStore()

const modelOptions = ref<SelectOption[]>([])
const loadingModels = ref(false)
const modelsError = ref<string | null>(null)

const providerOptions = computed<SelectOption[]>(() =>
  providersStore.configuredProviders.map((p) => ({ value: p.instanceId, label: p.displayName }))
)

const providerInstanceId = computed<string>({
  get: () => settings.judge.providerInstanceId,
  set: (value) => {
    settings.judge.providerInstanceId = value
    settings.judge.modelId = ''
  }
})

const modelId = computed<string>({
  get: () => settings.judge.modelId,
  set: (value) => {
    settings.judge.modelId = value
  }
})

async function loadModels(instanceId: string): Promise<void> {
  modelOptions.value = []
  modelsError.value = null
  if (!instanceId) return

  const provider = providersStore.getProvider(instanceId)
  if (!provider) return

  loadingModels.value = true
  try {
    if (KNOWN_PROVIDER_DEFAULTS[provider.type].isExternal) {
      const models = await api.fetchExternalModels(instanceId)
      modelOptions.value = models.map((m) => ({ value: m.id, label: m.name || m.id }))
    } else {
      const models = await api.fetchLocalModels(instanceId)
      modelOptions.value = models
        .filter((m) => m.type === 'llm')
        .map((m) => ({ value: m.id, label: m.name || m.id }))
    }
  } catch (err) {
    modelsError.value = err instanceof Error ? err.message : 'Failed to load models'
    log.error('Failed to load judge models:', err)
  } finally {
    loadingModels.value = false
  }
}

watch(
  () => settings.judge.providerInstanceId,
  (instanceId) => void loadModels(instanceId),
  { immediate: true }
)

const modelPlaceholder = computed<string>(() => {
  if (!settings.judge.providerInstanceId) return 'Select a provider first'
  if (loadingModels.value) return 'Loading models…'
  if (modelsError.value) return 'Models unavailable'
  return 'Select a model'
})
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="LLM judge" />
    <SettingsModalRow label="Judge provider" hint="Used by LLM-graded evals such as LLM Rubric">
      <Select
        v-model="providerInstanceId"
        :options="providerOptions"
        placeholder="Select a provider"
        class="input-md"
      />
    </SettingsModalRow>
    <SettingsModalRow label="Judge model" :hint="modelsError ?? 'The model that grades the output'">
      <Select
        v-model="modelId"
        :options="modelOptions"
        :placeholder="modelPlaceholder"
        :disabled="!settings.judge.providerInstanceId || loadingModels"
        searchable
        class="input-md"
      />
    </SettingsModalRow>
    <SettingsModalRow
      label="Judge temperature"
      hint="Lower values keep grading consistent. Leave empty to use the provider default"
    >
      <NumberInput
        v-model="settings.judge.temperature"
        :min="0"
        :max="2"
        :step="0.1"
        placeholder="Default"
        align-right
        class="input-sm"
      />
    </SettingsModalRow>
    <SettingsModalRow label="Judge max tokens" hint="Upper bound for the grading response">
      <NumberInput
        v-model="settings.judge.maxOutputTokens"
        :min="64"
        :step="64"
        placeholder="No limit"
        align-right
        class="input-sm"
      />
    </SettingsModalRow>
    <SettingsModalRow label="Judge timeout" hint="Grading timeout in milliseconds">
      <NumberInput
        v-model="settings.judge.timeoutMs"
        :min="0"
        :step="1000"
        placeholder="No timeout"
        align-right
        class="input-sm"
      />
    </SettingsModalRow>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.input-sm {
  width: 120px;
}

.input-md {
  width: 220px;
}
</style>
