<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import Toggle from '@renderer/components/ui/Toggle.vue'
import NumberInput from '@renderer/components/ui/NumberInput.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'
import SettingsModalJudge from './SettingsModalJudge.vue'

const settings = useSettingsStore()
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="Defaults" />
    <SettingsModalRow
      label="Unload other models before run"
      hint="Frees up memory by unloading any other loaded models before a run starts"
    >
      <Toggle v-model="settings.unloadModelsBeforeRun" />
    </SettingsModalRow>
    <SettingsModalRow
      label="Unload model after each run"
      hint="Frees up memory by unloading the model once its run finishes"
    >
      <Toggle v-model="settings.unloadModelsAfterRun" />
    </SettingsModalRow>
    <SettingsModalRow
      label="Auto-delete downloaded models"
      hint="Remove downloaded models after running test cases on it"
    >
      <Toggle v-model="settings.autoDeleteModels" />
    </SettingsModalRow>
    <SettingsModalRow
      label="Parallel runs"
      hint="Run multiple models simultaneously (External providers only)"
    >
      <Toggle v-model="settings.parallelRuns" />
    </SettingsModalRow>
    <SettingsModalRow label="Default test timeout" hint="Per-case timeout in milliseconds">
      <NumberInput
        :model-value="settings.defaultTestCaseTimeout"
        :min="0"
        :step="1000"
        align-right
        class="input-sm"
        @update:model-value="
          (v) => {
            if (v !== undefined) settings.defaultTestCaseTimeout = v
          }
        "
      />
    </SettingsModalRow>
  </div>
  <SettingsModalJudge />
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.input-sm {
  width: 120px;
}
</style>
