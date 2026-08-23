<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconArrowLeft, IconSettings, IconTestPipe } from '@tabler/icons-vue'
import { Button } from '@renderer/components/ui'
import { useShortcut } from '@renderer/composables/useShortcut'
import type { TestSuite, TestCase } from '@shared/app/test-suite'
import TestSuiteSettingsModal from './TestSuiteSettingsModal.vue'
import TestCaseList from './TestCaseList.vue'
import TestCaseEditor from './TestCaseEditor.vue'

const props = defineProps<{
  suite: TestSuite
}>()

const emit = defineEmits<{
  back: []
  save: [suite: TestSuite]
}>()

const suite = ref<TestSuite>(props.suite)
const selectedCaseId = ref<string | null>(null)
const isNewCase = ref(false)
const settingsOpen = ref(false)

const selectedCase = computed<TestCase | null>(() => {
  if (isNewCase.value) return null
  return suite.value.testCases.find((tc) => tc.id === selectedCaseId.value) ?? null
})

const editorOpen = computed(() => selectedCaseId.value !== null || isNewCase.value)

function onSelectCase(id: string): void {
  isNewCase.value = false
  selectedCaseId.value = selectedCaseId.value === id ? null : id
}

function onAddCase(): void {
  selectedCaseId.value = null
  isNewCase.value = true
}

function onCloseEditor(): void {
  selectedCaseId.value = null
  isNewCase.value = false
}

function onSaveCase(testCase: TestCase): void {
  const idx = suite.value.testCases.findIndex((tc) => tc.id === testCase.id)
  if (idx !== -1) {
    suite.value.testCases[idx] = testCase
  } else {
    suite.value.testCases.push(testCase)
  }
  onCloseEditor()
  onSave()
}

function onDeleteCase(): void {
  suite.value.testCases = suite.value.testCases.filter((tc) => tc.id !== selectedCaseId.value)
  onCloseEditor()
  onSave()
}

function onSave(): void {
  emit('save', suite.value)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(onSave, 500)
}

watch(
  () => suite.value.testCases,
  (cases) => {
    if (selectedCaseId.value && !cases.find((tc) => tc.id === selectedCaseId.value)) {
      onCloseEditor()
    }
  },
  { deep: true }
)

watch([() => suite.value.name, () => suite.value.description], scheduleSave)
watch(() => suite.value.defaultRunConfig, scheduleSave, { deep: true })

useShortcut('Escape', () => {
  if (!settingsOpen.value) emit('back')
})
</script>

<template>
  <div class="detail">
    <div class="detail-header">
      <div class="detail-header__left">
        <Button :icon="IconArrowLeft" :icon-stroke-width="2.5" @click="emit('back')">
          Test Suites
        </Button>
        <span class="suite-name">{{ suite.name }}</span>
      </div>
      <Button :icon="IconSettings" :icon-stroke-width="2.5" @click="settingsOpen = true">
        Suite Settings
      </Button>
    </div>

    <div class="panels">
      <TestCaseList
        :cases="suite.testCases"
        :selected-id="selectedCaseId"
        :suite="suite"
        @select-case="onSelectCase"
        @add-case="onAddCase"
      />
      <div v-if="editorOpen" class="editor-area">
        <TestCaseEditor
          :test-case="selectedCase"
          :is-new="isNewCase"
          @close="onCloseEditor"
          @save="onSaveCase"
          @delete="onDeleteCase"
        />
      </div>
      <div v-else class="editor-empty">
        <IconTestPipe :size="30" :stroke-width="1.5" />
        <span class="editor-empty__title">No test case selected</span>
        <span class="editor-empty__hint">
          Pick a test case from the list, or create a new one.
        </span>
      </div>
    </div>

    <TestSuiteSettingsModal
      v-model:open="settingsOpen"
      v-model:name="suite.name"
      v-model:description="suite.description"
      v-model:config="suite.defaultRunConfig"
      :created-at="suite.createdAt"
      :updated-at="suite.updatedAt"
    />
  </div>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
    flex-shrink: 0;

    &__left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
  }
}

.suite-name {
  font-family: var(--font-headline);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panels {
  display: grid;
  grid-template-columns: 20rem 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor-area {
  overflow: hidden;
  height: 100%;
}

.editor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  color: var(--text-muted);

  &__title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-secondary);
  }

  &__hint {
    font-size: var(--text-xs);
  }
}
</style>
