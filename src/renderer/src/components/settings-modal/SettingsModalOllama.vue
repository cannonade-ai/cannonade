<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@renderer/stores/settings'
import Input from '@renderer/components/ui/Input.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'

const settings = useSettingsStore()

const ollamaUrlInput = ref(settings.ollamaUrl)

watch(ollamaUrlInput, (value) => {
  try {
    new URL(value)
    settings.ollamaUrl = value
  } catch {
    /* invalid url */
  }
})
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="Ollama" />
    <SettingsModalRow label="API URL" hint="Ollama server URL">
      <Input
        v-model="ollamaUrlInput"
        type="url"
        placeholder="http://127.0.0.1:11434"
        class="input-url"
      />
    </SettingsModalRow>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.input-url {
  width: 250px;
}
</style>
