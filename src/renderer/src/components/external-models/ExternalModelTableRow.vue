<script setup lang="ts">
import { computed } from 'vue'
import { IconDotsVertical } from '@tabler/icons-vue'
import { Badge, Button, Chevron, CopyButton } from '@renderer/components/ui'
import { isMultimodal } from '@shared/provider/external-model'
import type { ExternalModel } from '@shared/provider/external-model'
import { formatContext, formatDate, formatDay, formatPrice } from '@renderer/utils/format'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { useExternalModelsViewStore } from '@renderer/stores/external-models-view'
import { useExternalModelMenus } from './useExternalModelMenus'

const props = defineProps<{ model: ExternalModel }>()

const viewStore = useExternalModelsViewStore()
const expanded = computed(() => viewStore.isExpanded(props.model.id))

const contextMenuStore = useContextMenuStore()
const { externalModelMenuItems } = useExternalModelMenus()

const menuItems = computed(() => externalModelMenuItems(props.model))

function onContextMenu(event: MouseEvent): void {
  if (!menuItems.value.length) return
  contextMenuStore.open(menuItems.value, event)
}

function onMenuButton(event: MouseEvent): void {
  contextMenuStore.openAt(menuItems.value, event.currentTarget as Element)
}

const isFree = computed(
  () =>
    props.model.pricing !== undefined &&
    props.model.pricing.inputPerMTokens === 0 &&
    props.model.pricing.outputPerMTokens === 0
)

const createdLabel = computed(() =>
  props.model.createdAt ? formatDate(new Date(props.model.createdAt * 1000).toISOString()) : '—'
)

const multimodal = computed(() => isMultimodal(props.model))

const modalitiesLabel = computed<string>(() => {
  const inputs = props.model.inputModalities ?? []
  const outputs = props.model.outputModalities ?? []
  if (inputs.length === 0 && outputs.length === 0) return ''
  return `${inputs.join(', ') || 'text'} → ${outputs.join(', ') || 'text'}`
})
</script>

<template>
  <div class="model-row" :class="{ expanded }" @contextmenu.prevent="onContextMenu">
    <button type="button" class="row-main" @click="viewStore.toggleExpanded(model.id)">
      <span class="cell cell--name">
        <span class="model-identity">
          <span class="model-name">{{ model.name }}</span>
          <span class="model-publisher">{{ model.publisher }}</span>
        </span>
        <span class="model-badges">
          <Badge v-if="multimodal" type="info">Multimodal</Badge>
          <Badge v-if="isFree" type="success">Free</Badge>
        </span>
      </span>
      <span class="cell cell--num">{{ formatContext(model.contextLength) }}</span>
      <span class="cell cell--num">
        {{ model.pricing && !isFree ? formatPrice(model.pricing.inputPerMTokens) : '—' }}
      </span>
      <span class="cell cell--num">
        {{ model.pricing && !isFree ? formatPrice(model.pricing.outputPerMTokens) : '—' }}
      </span>
      <span class="cell cell--actions">
        <Button
          v-if="menuItems.length"
          type="icon"
          :icon="IconDotsVertical"
          @click.stop="onMenuButton"
        />
      </span>
      <Chevron :expanded="expanded" />
    </button>

    <div v-if="expanded" class="row-details">
      <p v-if="model.description" class="description">{{ model.description }}</p>

      <div class="detail-grid">
        <div class="detail">
          <span class="detail-label">Model ID</span>
          <CopyButton :value="model.id" inset>
            <span class="detail-value detail-value--mono">{{ model.id }}</span>
          </CopyButton>
        </div>
        <div class="detail">
          <span class="detail-label">Created</span>
          <span class="detail-value">{{ createdLabel }}</span>
        </div>
        <div v-if="modalitiesLabel" class="detail">
          <span class="detail-label">Modalities</span>
          <span class="detail-value">{{ modalitiesLabel }}</span>
        </div>
        <div v-if="model.maxOutputTokens" class="detail">
          <span class="detail-label">Max Output</span>
          <span class="detail-value">{{ formatContext(model.maxOutputTokens) }} tokens</span>
        </div>
        <div v-if="model.knowledgeCutoff" class="detail">
          <span class="detail-label">Knowledge Cutoff</span>
          <span class="detail-value">{{ formatDay(model.knowledgeCutoff) }}</span>
        </div>
        <div v-if="model.isModerated !== undefined" class="detail">
          <span class="detail-label">Moderated</span>
          <span class="detail-value">{{ model.isModerated ? 'Yes' : 'No' }}</span>
        </div>
        <div v-if="model.expirationDate" class="detail">
          <span class="detail-label">Expires</span>
          <span class="detail-value">{{ formatDay(model.expirationDate) }}</span>
        </div>
        <div v-if="model.pricing?.cacheReadPerMTokens !== undefined" class="detail">
          <span class="detail-label">Cache Read</span>
          <span class="detail-value">{{ formatPrice(model.pricing.cacheReadPerMTokens) }}</span>
        </div>
      </div>

      <div v-if="model.supportedParameters?.length" class="detail">
        <span class="detail-label">Supported Parameters</span>
        <div class="param-badges">
          <Badge v-for="param in model.supportedParameters" :key="param" square>
            {{ param }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.model-row {
  border-bottom: 1px solid var(--border);

  &.expanded {
    background: var(--surface);
  }

  &:hover {
    background: var(--surface-hover);
  }
}

.row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.cell {
  &--name {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &--actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 1.625rem;
    flex-shrink: 0;
  }

  &--num {
    width: 5.5rem;
    text-align: right;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    flex-shrink: 0;
  }
}

.model-identity {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.model-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.model-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-publisher {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.row-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 12px 14px;
}

.description {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.detail-value {
  font-size: var(--text-xs);
  color: var(--text-secondary);

  &--mono {
    font-family: var(--font-mono, monospace);
    padding-right: 26px;
  }
}

.param-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
