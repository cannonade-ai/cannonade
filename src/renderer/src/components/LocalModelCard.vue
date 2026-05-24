<script setup lang="ts">
import { computed } from 'vue'
import { IconDotsVertical } from '@tabler/icons-vue'
import { formatBytes, formatContext } from '../utils/format'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import type { LocalModel } from '@shared/provider/local-model'
import type { ProviderCapabilities } from '@shared/provider/capabilities'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { useModelMenus } from './useModelMenus'

const props = defineProps<{
  model: LocalModel
  capabilities: ProviderCapabilities | null
}>()

const loadedInstances = computed(() => props.model.loadedInstances)
const isLoaded = computed(() => loadedInstances.value.length > 0)

const contextMenuStore = useContextMenuStore()
const { modelMenuItems } = useModelMenus()

function onContextMenu(event: MouseEvent): void {
  contextMenuStore.open(modelMenuItems(props.model, props.capabilities), event)
}

function onMenuButton(event: MouseEvent): void {
  contextMenuStore.openAt(
    modelMenuItems(props.model, props.capabilities),
    event.currentTarget as Element
  )
}
</script>

<template>
  <div class="model-card" :class="{ loaded: isLoaded }" @contextmenu.prevent="onContextMenu">
    <div class="card-header">
      <h3 class="model-name">{{ model.name }}</h3>
      <div class="card-header-actions">
        <Badge v-if="isLoaded" type="success">Loaded</Badge>
        <Button type="icon" :icon="IconDotsVertical" @click.stop="onMenuButton" />
      </div>
    </div>

    <div class="card-meta">
      <span class="publisher">{{ model.meta.publisher }}</span>
      <Badge type="secondary">{{ model.type === 'llm' ? 'LLM' : 'Embedding' }}</Badge>
      <Badge v-if="model.meta.format" type="secondary">
        {{ String(model.meta.format).toUpperCase() }}
      </Badge>
    </div>

    <div class="card-stats">
      <span v-if="model.meta.family" class="stat">
        <span class="stat-label">Family</span>
        <span class="stat-value">{{ model.meta.family }}</span>
      </span>
      <span v-if="model.meta.params_string" class="stat">
        <span class="stat-label">Params</span>
        <span class="stat-value">{{ model.meta.params_string }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Size</span>
        <span class="stat-value">{{ formatBytes(model.sizeBytes) }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Ctx</span>
        <span class="stat-value">{{ formatContext(model.maxContextLength ?? 0) }}</span>
      </span>
      <span v-if="model.meta.architecture" class="stat">
        <span class="stat-label">Arch</span>
        <span class="stat-value">{{ model.meta.architecture }}</span>
      </span>
      <span v-if="model.meta.quantization" class="stat">
        <span class="stat-label">Quant</span>
        <span class="stat-value">{{ model.meta.quantization }}</span>
      </span>
    </div>

    <div v-if="model.capabilities" class="card-capabilities">
      <Badge :type="model.capabilities.vision ? 'success' : 'default'" square>Vision</Badge>
      <Badge :type="model.capabilities.trained_for_tool_use ? 'success' : 'default'" square>
        Tool use
      </Badge>
    </div>

    <div v-if="isLoaded" class="loaded-instances">
      <div v-for="(instance, i) in loadedInstances" :key="instance.id ?? i" class="instance">
        <span class="instance-dot" />
        <span v-if="instance.config?.context_length" class="instance-label">
          {{ formatContext(instance.config.context_length) }} ctx
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.model-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: var(--border-hover);
    box-shadow: 0 4px 16px var(--shadow);
  }

  &.loaded {
    border-color: var(--accent-dim);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.model-name {
  font-size: var(--text-base);
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.publisher {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 0.5rem;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 4px;

  &-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-value {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-secondary);
  }
}

.card-capabilities {
  margin-top: 0.5rem;
  display: flex;
  gap: 6px;
}

.loaded-instances {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 4px;
  margin-top: 0.5rem;
}

.instance {
  display: flex;
  align-items: center;
  gap: 8px;

  &-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--green);
    flex-shrink: 0;
  }

  &-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }
}
</style>
