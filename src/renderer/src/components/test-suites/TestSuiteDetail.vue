<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { IconArrowLeft } from '@tabler/icons-vue'
import { Button } from '@renderer/components/ui'
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

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('back')
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="detail">
    <div class="detail-header">
      <Button :icon="IconArrowLeft" :icon-stroke-width="2.5" @click="emit('back')">
        Test Suites
      </Button>
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
        :suite="suite"
        @select-case="onSelectCase"
        @add-case="onAddCase"
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

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
}

.panels {
  display: grid;
  grid-template-columns: 20rem 1fr;
  grid-template-rows: auto 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
  align-content: start;

  &.editor-visible {
    align-content: stretch;
  }
}

.editor-area {
  overflow: hidden;
  height: 100%;
}
</style>
