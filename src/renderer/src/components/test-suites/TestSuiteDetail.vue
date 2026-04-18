<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-vue'
import BaseButton from '../BaseButton.vue'
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

function onSaveCase(testCase: TestCase): void {
  const idx = suite.value.testCases.findIndex((tc) => tc.id === testCase.id)
  if (idx !== -1) {
    suite.value.testCases[idx] = testCase
  } else {
    suite.value.testCases.push(testCase)
  }
  //onCloseEditor()
}

function onDeleteCase(): void {
  suite.value.testCases = suite.value.testCases.filter((tc) => tc.id !== selectedCaseId.value)
  onCloseEditor()
}

function onDeleteCaseById(id: string): void {
  suite.value.testCases = suite.value.testCases.filter((tc) => tc.id !== id)
  if (selectedCaseId.value === id) onCloseEditor()
}

function onCloneCaseById(id: string): void {
  const tc = suite.value.testCases.find((c) => c.id === id)
  if (!tc) return
  const clone = { ...tc, id: crypto.randomUUID(), name: `${tc.name} (copy)` }
  const idx = suite.value.testCases.findIndex((c) => c.id === id)
  suite.value.testCases.splice(idx + 1, 0, clone)
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
      <base-button :icon="IconArrowLeft" :icon-stroke-width="2.5" @click="emit('back')">
        Test Suites
      </base-button>
      <base-button type="secondary" :icon="IconDeviceFloppy" @click="onSave">
        Save Test Suite
      </base-button>
    </div>

    <div class="panels" :class="{ 'editor-visible': editorOpen }">
      <TestSuiteInfoPanel
        v-model:name="suite.name"
        v-model:description="suite.description"
        :created-at="suite.createdAt"
        :updated-at="suite.updatedAt"
      />
      <TestCaseList
        :cases="suite.testCases"
        :selected-id="selectedCaseId"
        @select-case="onSelectCase"
        @add-case="onAddCase"
        @delete-case="onDeleteCaseById"
        @clone-case="onCloneCaseById"
      />
      <TestSuiteRunConfigPanel v-model:config="suite.defaultRunConfig" />
      <div v-if="editorOpen" class="editor-area">
        <TestCaseEditor
          :test-case="selectedCase"
          :is-new="isNewCase"
          @close="onCloseEditor"
          @save="onSaveCase"
          @delete="onDeleteCase"
        />
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

.panels {
  display: grid;
  grid-template-columns: 20rem 1fr;
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
