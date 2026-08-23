<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconAlertTriangle, IconCloudDownload, IconHeart, IconLoader2 } from '@tabler/icons-vue'
import Badge from '@renderer/components/ui/Badge.vue'
import Button from '@renderer/components/ui/Button.vue'
import ExternalLink from '@renderer/components/ui/ExternalLink.vue'
import Field from '@renderer/components/ui/Field.vue'
import Input from '@renderer/components/ui/Input.vue'
import Modal from '@renderer/components/ui/Modal.vue'
import RadioGroup from '@renderer/components/ui/RadioGroup.vue'
import Select from '@renderer/components/ui/Select.vue'
import type { SelectOption } from '@renderer/components/ui/Select.vue'
import { api } from '@renderer/api'
import { formatBytes, formatContext, formatDay } from '@renderer/utils/format'
import {
  isHuggingFaceUrl,
  toHuggingFaceModelId,
  toHuggingFaceModelUrl,
  type HuggingFaceModelDetails
} from '@shared/provider/huggingface-model'
import { useModelDownloadsStore } from '@renderer/stores/model-downloads'
import { useProvidersStore } from '@renderer/stores/providers'
import { useToastStore } from '@renderer/stores/toast'
import { createLogger } from '@renderer/utils/logger'

const log = createLogger('local-model-download-modal')

const RESOLVE_DEBOUNCE_MS = 400
const PREFERRED_QUANT = 'Q4_K_M'

type DownloadSource = 'huggingface' | 'registry'

const model = defineModel<boolean>({ required: true })

const providersStore = useProvidersStore()
const downloadsStore = useModelDownloadsStore()
const toast = useToastStore()

const capabilities = computed(() => providersStore.activeCapabilities)
const providerLabel = computed<string>(
  () =>
    providersStore.localProviders.find((p) => p.instanceId === providersStore.activeLocalProvider)
      ?.displayName ?? 'your provider'
)
const registryUrl = computed<string>(() => capabilities.value?.modelRegistryUrl ?? '')
const huggingFaceUrl = computed<string>(() => capabilities.value?.huggingFaceModelsUrl ?? '')

const sourceOptions = computed<{ value: DownloadSource; label: string }[]>(() => {
  const options: { value: DownloadSource; label: string }[] = []
  if (huggingFaceUrl.value) options.push({ value: 'huggingface', label: 'HuggingFace' })
  if (registryUrl.value) options.push({ value: 'registry', label: 'Provider Registry' })
  return options
})

const source = ref<DownloadSource>('huggingface')
const input = ref('')
const details = ref<HuggingFaceModelDetails | null>(null)
const resolving = ref(false)
const resolveError = ref<string | null>(null)
const quantization = ref('')
const starting = ref(false)

let resolveTimer: ReturnType<typeof setTimeout> | undefined
let resolveToken = 0

const modelId = computed<string | null>(() =>
  source.value === 'huggingface' ? toHuggingFaceModelId(input.value) : null
)

const quantOptions = computed<SelectOption<string>[]>(
  () =>
    details.value?.quantOptions.map((q) => ({
      value: q.label,
      label: `${q.label} · ${formatBytes(q.sizeBytes)}`
    })) ?? []
)

const canDownload = computed<boolean>(() => {
  if (starting.value) return false
  if (source.value === 'registry') return input.value.trim().length > 0
  return !!modelId.value && !resolving.value
})

function reset(): void {
  input.value = ''
  details.value = null
  resolveError.value = null
  resolving.value = false
  quantization.value = ''
  resolveToken++
}

function pickDefaultQuant(resolved: HuggingFaceModelDetails): string {
  const preferred = resolved.quantOptions.find((q) => q.label === PREFERRED_QUANT)
  return preferred?.label ?? resolved.quantOptions[0]?.label ?? ''
}

async function resolveDetails(): Promise<void> {
  const id = modelId.value
  if (!id) {
    details.value = null
    resolveError.value = null
    return
  }
  const token = ++resolveToken
  resolving.value = true
  resolveError.value = null
  try {
    const resolved = await api.fetchHuggingFaceModelDetails(id)
    if (token !== resolveToken) return
    details.value = resolved
    quantization.value = pickDefaultQuant(resolved)
  } catch (e) {
    if (token !== resolveToken) return
    details.value = null
    quantization.value = ''
    resolveError.value = e instanceof Error ? e.message : 'Could not read model details'
    log.debug(`Failed to resolve "${id}":`, resolveError.value)
  } finally {
    if (token === resolveToken) resolving.value = false
  }
}

watch(input, (value) => {
  if (isHuggingFaceUrl(value) && sourceOptions.value.some((o) => o.value === 'huggingface')) {
    source.value = 'huggingface'
  }
  details.value = null
  quantization.value = ''
  resolveError.value = null
  clearTimeout(resolveTimer)
  if (source.value !== 'huggingface') return
  resolveTimer = setTimeout(() => void resolveDetails(), RESOLVE_DEBOUNCE_MS)
})

watch(source, () => {
  details.value = null
  quantization.value = ''
  resolveError.value = null
  clearTimeout(resolveTimer)
  if (source.value === 'huggingface') void resolveDetails()
})

watch(sourceOptions, (options) => {
  if (options.length > 0 && !options.some((o) => o.value === source.value)) {
    source.value = options[0].value
  }
})

watch(model, (open) => {
  if (open) reset()
  else clearTimeout(resolveTimer)
})

async function startDownload(): Promise<void> {
  const instanceId = providersStore.activeLocalProvider
  if (!instanceId || !canDownload.value) return

  const isHuggingFace = source.value === 'huggingface'
  const id = modelId.value
  if (isHuggingFace && !id) return

  starting.value = true
  try {
    await downloadsStore.start({
      instanceId,
      downloadTarget: isHuggingFace ? toHuggingFaceModelUrl(id!) : input.value.trim(),
      label: isHuggingFace ? id! : input.value.trim(),
      quantization: isHuggingFace && quantization.value ? quantization.value : undefined
    })
    model.value = false
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start the download'
    toast.error(message, { title: 'Download failed' })
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <Modal v-model="model" title="Download Model" size="md">
    <div class="download-form">
      <Field v-if="sourceOptions.length > 1" label="Source">
        <RadioGroup v-model="source" :options="sourceOptions" type="rounded" />
      </Field>

      <Field
        :label="source === 'huggingface' ? 'HuggingFace Model' : 'Registry Model'"
        :hint="
          source === 'huggingface'
            ? 'Paste a model card URL or its id (publisher/model-name).'
            : `Paste the model name exactly as the provider's registry lists it.`
        "
      >
        <Input
          v-model="input"
          :placeholder="
            source === 'huggingface' ? 'publisher/model-name or model card URL' : 'model-name:tag'
          "
          @submit="startDownload"
        />
      </Field>

      <template v-if="details">
        <Field v-if="quantOptions.length > 0" label="Quantization">
          <Select
            v-model="quantization"
            :options="quantOptions"
            class="quant-select"
            searchable
            :drop-up="false"
          />
        </Field>

        <p v-else class="quant-hint">
          No GGUF quantizations found in this repository — the provider will pick what it can use.
        </p>
      </template>

      <ExternalLink
        v-if="source === 'huggingface' ? huggingFaceUrl : registryUrl"
        class="browse-link"
        :href="source === 'huggingface' ? huggingFaceUrl : registryUrl"
      >
        Browse models compatible with {{ providerLabel }}
      </ExternalLink>

      <div v-if="source === 'huggingface' && resolving" class="resolve-state">
        <IconLoader2 :size="14" class="spin" />
        Reading model details…
      </div>

      <div v-else-if="source === 'huggingface' && resolveError" class="resolve-state error">
        <IconAlertTriangle :size="14" />
        {{ resolveError }}
      </div>

      <div v-else-if="details" class="details">
        <div class="details-header">
          <span class="details-id">{{ details.modelId }}</span>
          <Badge v-if="details.isGated" type="danger">Gated</Badge>
          <span class="details-likes">
            <IconHeart :size="12" :stroke-width="2" />
            {{ details.likeCount.toLocaleString() }}
          </span>
        </div>

        <div class="details-stats">
          <span class="stat">
            <span class="stat-label">Author</span>
            <span class="stat-value">{{ details.author }}</span>
          </span>
          <span v-if="details.architecture" class="stat">
            <span class="stat-label">Architecture</span>
            <span class="stat-value">{{ details.architecture }}</span>
          </span>
          <span v-if="details.contextLength" class="stat">
            <span class="stat-label">Context</span>
            <span class="stat-value">{{ formatContext(details.contextLength) }}</span>
          </span>
          <span v-if="details.task" class="stat">
            <span class="stat-label">Task</span>
            <span class="stat-value">{{ details.task }}</span>
          </span>
          <span class="stat">
            <span class="stat-label">Downloads</span>
            <span class="stat-value">{{ details.downloadCount.toLocaleString() }}</span>
          </span>
          <span v-if="details.updatedAt" class="stat">
            <span class="stat-label">Updated</span>
            <span class="stat-value">{{ formatDay(details.updatedAt) }}</span>
          </span>
        </div>
      </div>
    </div>

    <template #actions="{ close }">
      <Button @click="close">Cancel</Button>
      <Button
        type="primary"
        :icon="starting ? IconLoader2 : IconCloudDownload"
        :disabled="!canDownload"
        @click="startDownload"
      >
        Download
      </Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.download-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.browse-link {
  font-size: var(--text-xs);
  align-self: flex-start;
}

.resolve-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-height: 32px;

  &.error {
    color: var(--error);
  }
}

.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.details-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .details-id {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .details-likes {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
}

.details-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 8px 12px;

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .stat-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .stat-value {
    font-size: var(--text-xs);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.quant-select :deep(.dropdown ul) {
  max-height: 10rem;
}

.quant-hint {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
