<script setup lang="ts">
import { IconBrain, IconFlask, IconPlayerPlay, IconSettings } from '@tabler/icons-vue'
import { useNavigationStore } from '../stores/navigation'
import SidebarNavItem from './SidebarNavItem.vue'

const nav = useNavigationStore()
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <SidebarNavItem
        :icon="IconBrain"
        label="Models"
        :active="nav.current === 'models'"
        @click="nav.navigate('models')"
      />
      <SidebarNavItem
        :icon="IconFlask"
        label="Test Suites"
        :active="nav.current === 'test-suites'"
        @click="nav.navigate('test-suites')"
      />
      <SidebarNavItem
        :icon="IconPlayerPlay"
        label="Test Runs"
        :active="nav.current === 'test-runs'"
        @click="nav.navigate('test-runs')"
      />
    </nav>

    <div class="sidebar-bottom">
      <SidebarNavItem
        :icon="IconSettings"
        label="Settings"
        :active="nav.current === 'settings'"
        @click="nav.navigate('settings')"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 52px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.brand-logo {
  font-size: 1.1rem;
}

.brand-title {
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  flex: 1;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 8px 12px;
  border-top: 1px solid var(--border);
}
</style>
