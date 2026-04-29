<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNavigationStore } from '@renderer/stores/navigation'
import { useSettingsStore } from '@renderer/stores/settings'
import AppSidebar from '@renderer/components/AppSidebar.vue'
import AppTitleBar from '@renderer/components/AppTitleBar.vue'
import { DashboardView, TestSuitesView, TestRunsView, SettingsView } from '@renderer/views'

const nav = useNavigationStore()
const settings = useSettingsStore()

onMounted(() => {
  settings.init()
})

const viewComponent = computed(() => {
  switch (nav.current) {
    case 'test-suites':
      return TestSuitesView
    case 'test-runs':
      return TestRunsView
    case 'settings':
      return SettingsView
    default:
      return DashboardView
  }
})
</script>

<template>
  <div class="layout">
    <AppTitleBar />
    <div class="layout-body">
      <AppSidebar />
      <main class="app-content">
        <component :is="viewComponent" />
      </main>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
@import './styles/colors.scss';
@import './styles/variables.scss';
@import './styles/animations.scss';

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  transition:
    background 0.2s,
    color 0.2s;
}

#app {
  height: 100%;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-hover);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

::-webkit-scrollbar-corner {
  background: transparent;
}
</style>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: var(--bg);
}
</style>
