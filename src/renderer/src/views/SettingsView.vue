<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="settings">
    <h2 class="page-title">Settings</h2>

    <section class="settings-group">
      <h3 class="group-title">General</h3>
      <div class="group-body">
        <p class="empty-group">No settings yet.</p>
      </div>
    </section>

    <section class="settings-group">
      <h3 class="group-title">Appearance</h3>
      <div class="group-body">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Dark mode</span>
            <span class="setting-desc">Switch between light and dark theme</span>
          </div>
          <button
            class="toggle"
            :class="{ on: settings.isDark }"
            role="switch"
            :aria-checked="settings.isDark"
            @click="settings.toggleTheme"
          >
            <span class="toggle-thumb" />
          </button>
        </div>
      </div>
    </section>

    <section class="settings-group">
      <h3 class="group-title">Integrations</h3>
      <div class="group-body">
        <p class="empty-group">No settings yet.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  max-width: 640px;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: var(--font-headline);
  color: var(--text-primary);
  margin-bottom: 28px;
}

.settings-group {
  margin-bottom: 28px;
}

.group-title {
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-headline);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.group-body {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--surface);
}

.setting-row + .setting-row {
  border-top: 1px solid var(--border);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.empty-group {
  padding: 14px 16px;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--surface);
}

.toggle {
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--surface-elevated);
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: background 0.2s;
}

.toggle.on {
  background: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--text-muted);
  transition:
    transform 0.2s,
    background 0.2s;
}

.toggle.on .toggle-thumb {
  transform: translateX(18px);
  background: #fff;
}
</style>
