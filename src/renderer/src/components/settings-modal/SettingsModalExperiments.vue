<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import Toggle from '@renderer/components/ui/Toggle.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'

const settings = useSettingsStore()

const CANNONADE_MANAGED_SERVERS_INFO =
  'Some local servers offer no way to shut themselves down, so Cannonade controls them at the ' +
  'process level instead. It launches the server itself and ends that process when you ask it ' +
  'to stop. It only ever touches servers it started, and closes them when you quit. Providers ' +
  'that come with their own server control are unaffected by this setting.' +
  '\n\n' +
  'Ending a process might cause unexpected side effects. Anything still in progress, like a ' +
  'download or a model being loaded, may be cut short.'
</script>

<template>
  <div class="section">
    <p class="section-note">
      Experiments are opt-in features. They may not work reliably, and can change without notice.
    </p>
    <SettingsModalDivider label="Local servers" />
    <SettingsModalRow
      label="Cannonade-managed servers"
      hint="Process-level Start and Stop for local providers that don't support being stopped"
      :info="CANNONADE_MANAGED_SERVERS_INFO"
    >
      <Toggle v-model="settings.experiments.cannonadeManagedServers" />
    </SettingsModalRow>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.section-note {
  font-size: var(--text-xs);
  line-height: 1.55;
  color: var(--text-muted);
  margin-bottom: 4px;
}
</style>
