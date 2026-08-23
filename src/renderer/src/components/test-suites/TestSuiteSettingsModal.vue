<script setup lang="ts">
import { Button, Modal } from '@renderer/components/ui'
import type { RunConfig } from '@shared/app/test-suite'
import TestSuiteInfoPanel from './TestSuiteInfoPanel.vue'
import TestSuiteRunConfigPanel from './TestSuiteRunConfigPanel.vue'

const open = defineModel<boolean>('open', { required: true })
const name = defineModel<string>('name', { required: true })
const description = defineModel<string | undefined>('description')
const config = defineModel<RunConfig | undefined>('config')

defineProps<{
  createdAt: string
  updatedAt: string
}>()
</script>

<template>
  <Modal v-model="open" title="Suite Settings" size="lg">
    <div class="settings-sections">
      <TestSuiteInfoPanel
        v-model:name="name"
        v-model:description="description"
        :created-at="createdAt"
        :updated-at="updatedAt"
      />
      <TestSuiteRunConfigPanel v-model:config="config" />
    </div>
    <template #actions="{ close }">
      <Button type="primary" @click="close">Done</Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
