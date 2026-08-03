<script setup lang="ts">
import type { TooltipPlacement } from '@renderer/utils/tooltip'
import InfoTooltip from '@renderer/components/ui/InfoTooltip.vue'

defineProps<{
  label: string
  hint?: string
  info?: string
  infoPlacement?: TooltipPlacement
}>()
</script>

<template>
  <div class="row">
    <div class="row-label">
      <span class="row-name">
        {{ label }}
        <InfoTooltip
          v-if="info"
          :content="info"
          :size="13"
          :placement="infoPlacement ?? 'right'"
          interactive
        />
      </span>
      <span v-if="hint" class="row-hint">{{ hint }}</span>
    </div>
    <div class="row-control">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
}

.row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.row-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.row-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.row-control {
  flex-shrink: 0;
}
</style>
