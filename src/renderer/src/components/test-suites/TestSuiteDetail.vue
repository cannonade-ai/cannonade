<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-vue'
import type { TestSuite, TestCase } from '@shared/app/test-suite'
import TestSuiteInfoPanel from './TestSuiteInfoPanel.vue'
import TestSuiteRunConfigPanel from './TestSuiteRunConfigPanel.vue'
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

function onSave(): void {
  emit('save', suite.value)
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('back')
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="detail">
    <div class="detail-header">
      <button class="btn-back" @click="emit('back')">
        <icon-arrow-left :size="14" :stroke-width="2.5" />
        Test Suites
      </button>
      <button class="btn-save" @click="onSave">
        <icon-device-floppy :size="14" />
        Save Test Suite
      </button>
    </div>

    <div class="panels" :class="{ 'editor-visible': editorOpen }">
      <TestSuiteInfoPanel :suite="suite" />
      <TestCaseList
        :cases="suite.testCases"
        :selected-id="selectedCaseId"
        @select-case="onSelectCase"
        @add-case="onAddCase"
      />
      <TestSuiteRunConfigPanel :config="suite.defaultRunConfig" />
      <div v-if="editorOpen" class="editor-area">
        <TestCaseEditor :test-case="selectedCase" :is-new="isNewCase" @close="onCloseEditor" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.btn-back:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.btn-save:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.panels {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  align-content: start;
}

.editor-visible {
  align-content: stretch;
}

.editor-area {
  overflow: hidden;
  height: 100%;
}
</style>
