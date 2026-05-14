<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import Toggle from '@renderer/components/ui/Toggle.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'

const settings = useSettingsStore()
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="Theme" />
    <SettingsModalRow label="Dark mode" hint="Switch between light and dark theme">
      <Toggle v-model="settings.isDark" />
    </SettingsModalRow>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}
</style>
