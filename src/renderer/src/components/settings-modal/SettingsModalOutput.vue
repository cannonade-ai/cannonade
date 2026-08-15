<script setup lang="ts">
import { useSettingsStore } from '@renderer/stores/settings'
import Textarea from '@renderer/components/ui/Textarea.vue'
import Toggle from '@renderer/components/ui/Toggle.vue'
import InfoTooltip from '@renderer/components/ui/InfoTooltip.vue'
import SettingsModalRow from './SettingsModalRow.vue'
import SettingsModalDivider from './SettingsModalDivider.vue'
import { CONTENT_PLACEHOLDER } from '@renderer/utils/html-output'

const settings = useSettingsStore()

const templatePlaceholder = `<section class="wrapper">\n  ${CONTENT_PLACEHOLDER}\n</section>`

const templateInfo = [
  `Rendered HTML output is placed into this markup, so you can reproduce the page it normally appears in.`,
  `${CONTENT_PLACEHOLDER} marks where the output goes, and can be used more than once. Without it, the output is appended after the template.`,
  `Anything valid inside a document body works: wrapper elements whose classes your CSS targets, <style> blocks, and <link> tags for external stylesheets and fonts.`,
  `Leave it empty to render output on its own. Output that is already a complete HTML document ignores the template.`
].join('\n\n')
</script>

<template>
  <div class="section">
    <SettingsModalDivider label="HTML Preview" />
    <SettingsModalRow
      label="Render HTML by default"
      hint="Show HTML output rendered instead of as raw text"
      info="Only sets the initial state. You can still switch any output between rendered and raw."
    >
      <Toggle v-model="settings.htmlPreviewByDefault" />
    </SettingsModalRow>
    <div class="template-field">
      <div class="template-field-label">
        <span class="template-field-name">
          Template
          <InfoTooltip :content="templateInfo" :size="13" placement="right" interactive />
        </span>
        <span class="template-field-hint">
          Markup the output is rendered into, with {{ CONTENT_PLACEHOLDER }} where it belongs.
        </span>
      </div>
      <Textarea
        v-model="settings.htmlPreviewTemplate"
        :rows="10"
        :placeholder="templatePlaceholder"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.section {
  display: flex;
  flex-direction: column;
}

.template-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem 0;
}

.template-field-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-field-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.template-field-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
