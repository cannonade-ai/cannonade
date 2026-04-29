<script setup lang="ts">
import { ref } from 'vue'
import { IconBrain, IconFlask, IconPlayerPlay, IconSettings } from '@tabler/icons-vue'
import { useNavigationStore } from '@renderer/stores/navigation'
import SidebarNavItem from './SidebarNavItem.vue'

const nav = useNavigationStore()
const collapsed = ref(false)
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="sidebar-nav">
      <SidebarNavItem
        :icon="IconBrain"
        label="Local Models"
        :active="nav.current === 'local-models'"
        :collapsed="collapsed"
        @click="nav.navigate('local-models')"
      />
      <SidebarNavItem
        :icon="IconFlask"
        label="Test Suites"
        :active="nav.current === 'test-suites'"
        :collapsed="collapsed"
        @click="nav.navigate('test-suites')"
      />
      <SidebarNavItem
        :icon="IconPlayerPlay"
        label="Test Runs"
        :active="nav.current === 'test-runs'"
        :collapsed="collapsed"
        @click="nav.navigate('test-runs')"
      />
    </nav>

    <div class="sidebar-bottom">
      <SidebarNavItem
        :icon="IconSettings"
        label="Settings"
        :active="nav.current === 'settings'"
        :collapsed="collapsed"
        @click="nav.navigate('settings')"
      />
    </div>

    <button class="circle-btn" @click="collapsed = !collapsed">
      <svg viewBox="0 0 24 24" class="arrow">
        <path class="chevron" :class="{ expanded: !collapsed }" />
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 12rem;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar nav,
.sidebar-bottom {
  overflow: hidden;
}

.sidebar.collapsed {
  width: 2.75rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0;
  flex: 1;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}

.circle-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  padding: 0;
}

.circle-btn:hover {
  background: var(--surface-elevated);
}

.arrow {
  width: 14px;
  height: 14px;
}

.chevron {
  fill: none;
  stroke: var(--text-secondary);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: d 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  d: path('M9 6 L15 12 L9 18');
}

.chevron.expanded {
  d: path('M15 6 L9 12 L15 18');
}
</style>
