<script setup lang="ts">
import { IconVersions, IconDotsVertical } from '@tabler/icons-vue'
import { Button } from '@renderer/components/ui'
import { formatDate } from '@renderer/utils/format'
import { useContextMenuStore } from '@renderer/stores/context-menu'
import { usePromptMenus } from './usePromptMenus'
import { getLatestVersion } from '@shared/app/prompt'
import type { Prompt } from '@shared/app/prompt'

defineProps<{
  prompts: Prompt[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'select-prompt': [id: string]
}>()

const contextMenuStore = useContextMenuStore()
const { promptMenuItems } = usePromptMenus()
</script>

<template>
  <div class="list-wrap">
    <div v-if="prompts.length === 0" class="empty">
      No prompts yet. Create one to reuse system prompts across test cases.
    </div>
    <ul v-else class="prompt-list">
      <li
        v-for="prompt in prompts"
        :key="prompt.id"
        class="prompt-item"
        :class="{ active: selectedId === prompt.id }"
        @click="emit('select-prompt', prompt.id)"
        @contextmenu.prevent="contextMenuStore.open(promptMenuItems(prompt.id), $event)"
      >
        <div class="prompt-main">
          <span class="prompt-name">{{ prompt.name }}</span>
          <span v-if="prompt.description" class="prompt-desc">{{ prompt.description }}</span>
          <span v-else class="prompt-preview">{{ getLatestVersion(prompt).content }}</span>
        </div>
        <div class="prompt-aside">
          <div class="aside-top">
            <span class="version-count">
              <IconVersions :size="11" :stroke-width="2" />
              v{{ getLatestVersion(prompt).version }}
            </span>
            <Button
              type="icon"
              :icon="IconDotsVertical"
              @click.stop="
                contextMenuStore.openAt(promptMenuItems(prompt.id), $event.currentTarget)
              "
            />
          </div>
          <span class="prompt-date">Updated {{ formatDate(prompt.updatedAt) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.list-wrap {
  flex: 1;
  overflow-y: auto;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.prompt-list {
  list-style: none;
}

.prompt-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: var(--list-item-padding);
  border-bottom: 1px solid var(--border);
  border-left: var(--inactive-left-border);
  cursor: pointer;
  transition: background 0.12s;
  height: var(--list-item-height);

  &:hover {
    background: var(--surface-hover);
  }

  &.active {
    background: var(--accent-dim);
    border-left: var(--active-left-border);
    padding-left: 18px;
  }
}

.prompt-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  .prompt-name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .prompt-desc,
  .prompt-preview {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .prompt-preview {
    color: var(--text-muted);
  }
}

.prompt-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;

  .aside-top {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .prompt-date {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}

.version-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}
</style>
