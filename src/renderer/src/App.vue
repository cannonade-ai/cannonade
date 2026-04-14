<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNavigationStore } from './stores/navigation'
import { useSettingsStore } from './stores/settings'
import AppSidebar from './components/AppSidebar.vue'
import DashboardView from './views/DashboardView.vue'
import TestSuitesView from './views/TestSuitesView.vue'
import TestRunsView from './views/TestRunsView.vue'
import SettingsView from './views/SettingsView.vue'

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
    <AppSidebar />
    <main class="app-content">
      <component :is="viewComponent" />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --bg: #e2e2e2;
  --surface: #f4f4f4;
  --surface-elevated: #e9e9e9;
  --surface-hover: #dcdcdc;
  --border: rgba(72, 72, 71, 0.15);
  --border-hover: rgba(72, 72, 71, 0.35);
  --text-primary: #0e0e0e;
  --text-secondary: #484847;
  --text-muted: #767575;
  --accent: rgb(151, 106, 0);
  --accent-dim: rgba(255, 179, 0, 0.2);
  --accent-border: rgba(255, 179, 0, 0.5);
  --blue: #1a56a4;
  --blue-dim: rgba(26, 86, 164, 0.08);
  --green: #00873a;
  --green-dim: rgba(0, 135, 58, 0.2);
  --error: #d50000;
  --shadow: rgba(0, 0, 0, 0.08);
  --radius: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-full: 9999px;
  --font-headline: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}

.dark {
  --bg: #0e0e0e;
  --surface: #131313;
  --surface-elevated: #1a1a1a;
  --surface-hover: #222222;
  --border: #333333;
  --border-hover: #484847;
  --text-primary: #dae2fd;
  --text-secondary: #adaaaa;
  --text-muted: #636363;
  --accent: rgb(255, 179, 0);
  --accent-dim: rgba(255, 179, 0, 0.2);
  --accent-border: rgba(255, 197, 99, 0.3);
  --blue: #dae2fd;
  --blue-dim: rgba(218, 226, 253, 0.1);
  --green: #4ade80;
  --green-dim: rgba(74, 222, 128, 0.12);
  --error: #ffb4ab;
  --shadow: rgba(0, 0, 0, 0.6);
  --radius: 0px;
  --radius-lg: 2px;
  --radius-xl: 4px;
  --radius-full: 9999px;
  --font-headline: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Space Grotesk', system-ui, sans-serif;
}

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
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  transition:
    background 0.2s,
    color 0.2s;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}
</style>
