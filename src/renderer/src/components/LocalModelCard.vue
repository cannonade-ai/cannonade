<script setup lang="ts">
import { computed } from 'vue'
import { IconDotsVertical } from '@tabler/icons-vue'
import { formatBytes, formatContext } from '../utils/format'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import type { Model } from '@shared/lm-studio/ipc-contracts'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { useModelMenus } from './useModelMenus'

const props = defineProps<{ model: Model }>()

const isLoaded = computed(() => props.model.loaded_instances.length > 0)
const contextMenuStore = useContextMenuStore()
const { modelMenuItems } = useModelMenus()

function onContextMenu(event: MouseEvent): void {
  contextMenuStore.open(modelMenuItems(props.model), event)
}

function onMenuButton(event: MouseEvent): void {
  contextMenuStore.openAt(modelMenuItems(props.model), event.currentTarget as Element)
}
</script>

<template>
  <div class="model-card" :class="{ loaded: isLoaded }" @contextmenu.prevent="onContextMenu">
    <div class="card-header">
      <h3 class="model-name">{{ model.display_name }}</h3>
      <div class="card-header-actions">
        <Badge v-if="isLoaded" type="success">Loaded</Badge>
        <Button type="icon" :icon="IconDotsVertical" @click.stop="onMenuButton" />
      </div>
    </div>

    <div class="card-meta">
      <span class="publisher">{{ model.publisher }}</span>
      <Badge type="secondary">{{ model.type === 'llm' ? 'LLM' : 'Embedding' }}</Badge>
      <Badge v-if="model.format" type="secondary">{{ model.format.toUpperCase() }}</Badge>
    </div>

    <div class="card-stats">
      <span v-if="model.params_string" class="stat">
        <span class="stat-label">Params</span>
        <span class="stat-value">{{ model.params_string }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Size</span>
        <span class="stat-value">{{ formatBytes(model.size_bytes) }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Ctx</span>
        <span class="stat-value">{{ formatContext(model.max_context_length) }}</span>
      </span>
      <span v-if="model.architecture" class="stat">
        <span class="stat-label">Arch</span>
        <span class="stat-value">{{ model.architecture }}</span>
      </span>
      <span v-if="model.quantization?.name" class="stat">
        <span class="stat-label">Quant</span>
        <span class="stat-value">{{ model.quantization.name }}</span>
      </span>
    </div>

    <div v-if="model.capabilities" class="card-capabilities">
      <Badge :type="model.capabilities.vision ? 'success' : 'default'" square> Vision </Badge>
      <Badge :type="model.capabilities.trained_for_tool_use ? 'success' : 'default'" square>
        Tool use
      </Badge>

      <div v-if="isLoaded" class="loaded-instances">
        <div v-for="instance in model.loaded_instances" :key="instance.id" class="instance">
          <span class="instance-dot" />
          <span class="instance-label">
            {{ formatContext(instance.config.context_length) }} ctx
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.model-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
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
    border-color: var(--accent-border);
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
  gap: 6px 10px;
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

.quant-bits {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.card-capabilities {
  margin-top: 0.5rem;
  display: flex;
  gap: 6px;
}

.loaded-instances {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: end;
  gap: 4px;
  padding-top: 4px;
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
