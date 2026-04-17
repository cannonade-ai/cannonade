<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNavigationStore } from './stores/navigation'
import { useSettingsStore } from './stores/settings'
import AppSidebar from './components/AppSidebar.vue'
import AppTitleBar from './components/AppTitleBar.vue'
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

:root {
  --color-amber-50: #fffbeb;
  --color-amber-100: #fef3c6;
  --color-amber-200: #fee685;
  --color-amber-300: #ffd236;
  --color-amber-400: #fcbb00;
  --color-amber-500: #f99c00;
  --color-amber-600: #dd7400;
  --color-amber-700: #b75000;
  --color-amber-800: #953d00;
  --color-amber-900: #7b3306;
  --color-amber-950: #461901;

  --color-stone-50: #fafaf9;
  --color-stone-100: #f5f5f4;
  --color-stone-200: #e7e5e4;
  --color-stone-300: #d6d3d1;
  --color-stone-400: #a6a09b;
  --color-stone-500: #79716b;
  --color-stone-600: #57534d;
  --color-stone-700: #44403b;
  --color-stone-800: #292524;
  --color-stone-900: #1c1917;
  --color-stone-950: #0c0a09;

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
  --list-item-padding: 14px 20px;

  --font-headline: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;

  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-4xl: 2rem;
  --radius-full: 50%;

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --animate-spin: spin 1s linear infinite;
  --animate-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s infinite;
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
  --font-body: 'Inter', system-ui, sans-serif;
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
