<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IconX,
  IconAdjustments,
  IconServer,
  IconPalette,
  IconTestPipe,
  IconFlask
} from '@tabler/icons-vue'
import { useNavigationStore } from '@renderer/stores/navigation'
import { Button } from '@renderer/components/ui'
import { useShortcut } from '@renderer/composables/useShortcut'
import SettingsModalNav from './SettingsModalNav.vue'
import SettingsModalGeneral from './SettingsModalGeneral.vue'
import SettingsModalProviders from './SettingsModalProviders.vue'
import SettingsModalAppearance from './SettingsModalAppearance.vue'
import SettingsModalTestRuns from './SettingsModalTestRuns.vue'
import SettingsModalExperiments from './SettingsModalExperiments.vue'
import InfoTooltip from '@renderer/components/ui/InfoTooltip.vue'

type SectionId = 'general' | 'providers' | 'appearance' | 'test-runs' | 'experiments'

const nav = useNavigationStore()
const activeSection = computed({
  get: () => nav.settingsSection as SectionId,
  set: (v: SectionId) => {
    nav.settingsSection = v
  }
})

const sections: { id: SectionId; label: string; icon: unknown; info?: string }[] = [
  { id: 'general', label: 'General', icon: IconAdjustments },
  {
    id: 'providers',
    label: 'Providers',
    icon: IconServer,
    info: 'Configure the AI providers and local servers used to run your models.'
  },
  { id: 'test-runs', label: 'Test Runs', icon: IconTestPipe },
  { id: 'appearance', label: 'Appearance', icon: IconPalette },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: IconFlask
  }
]

const activeSectionMeta = computed(() => sections.find((s) => s.id === activeSection.value))

const sectionComponents: Record<SectionId, unknown> = {
  general: SettingsModalGeneral,
  providers: SettingsModalProviders,
  'test-runs': SettingsModalTestRuns,
  appearance: SettingsModalAppearance,
  experiments: SettingsModalExperiments
}

const pressedOnBackdrop = ref(false)
function onBackdropClick(): void {
  if (pressedOnBackdrop.value) nav.closeSettings()
  pressedOnBackdrop.value = false
}

useShortcut('Escape', () => {
  if (nav.settingsOpen) nav.closeSettings()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="settings">
      <div
        v-if="nav.settingsOpen"
        class="settings-overlay"
        @mousedown="pressedOnBackdrop = $event.target === $event.currentTarget"
        @click.self="onBackdropClick"
      >
        <div class="settings-panel">
          <aside class="settings-sidebar">
            <div class="settings-sidebar-title">Settings</div>
            <SettingsModalNav v-model="activeSection" :sections="sections" />
          </aside>

          <div class="settings-content">
            <div class="settings-content-header">
              <h2 class="settings-content-title">
                {{ activeSectionMeta?.label }}
                <InfoTooltip
                  v-if="activeSectionMeta?.info"
                  :content="activeSectionMeta.info"
                  placement="bottom"
                />
              </h2>
              <Button
                type="icon"
                :icon="IconX"
                :icon-size="18"
                :icon-stroke-width="3"
                @click="nav.closeSettings"
              />
            </div>
            <div class="settings-content-body">
              <component :is="sectionComponents[activeSection]" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.settings-panel {
  display: flex;
  width: 860px;
  max-width: calc(100vw - 2rem);
  height: 560px;
  max-height: calc(100vh - 4rem);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.35),
    0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 0 16px;
}

.settings-sidebar-title {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 16px 12px;
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.settings-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.settings-content-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-headline);
  font-size: var(--text);
  font-weight: 600;
  color: var(--text-primary);
}

.settings-content-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-gutter: stable;
}

.settings {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.18s var(--ease-out);

    .settings-panel {
      transition:
        opacity 0.18s var(--ease-out),
        transform 0.18s var(--ease-out);
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .settings-panel {
      opacity: 0;
      transform: scale(0.97) translateY(-6px);
    }
  }
}
</style>
