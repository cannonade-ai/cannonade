<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import Toggle from '@renderer/components/ui/Toggle.vue'
import NumberInput from '@renderer/components/ui/NumberInput.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'

const settings = useSettingsStore()
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="Defaults" />
    <SettingsModalRow
      label="Auto-delete downloaded models"
      hint="Remove downloaded models after running test cases on it"
    >
      <Toggle v-model="settings.autoDeleteModels" />
    </SettingsModalRow>
    <SettingsModalRow
      label="Parallel runs"
      hint="Run multiple models simultaneously (OpenRouter only)"
    >
      <Toggle v-model="settings.parallelRuns" />
    </SettingsModalRow>
    <SettingsModalRow label="Default test timeout" hint="Per-case timeout in milliseconds">
      <NumberInput
        :model-value="settings.defaultTestTimeout"
        :min="1000"
        :step="1000"
        align-right
        class="input-sm"
        @update:model-value="
          (v) => {
            if (v !== undefined) settings.defaultTestTimeout = v
          }
        "
      />
    </SettingsModalRow>
  </div>
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
