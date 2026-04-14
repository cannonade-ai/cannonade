<script setup lang="ts">
import { IconTank } from '@tabler/icons-vue'
import { api } from '../api'
</script>

<template>
  <header class="title-bar">
    <div class="title-bar-left">
      <IconTank color="rgb(151, 106, 0)" :size="22" :stroke-width="1" />
      <span class="app-name">Cannonade</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" @click="api.minimize()">
        <span class="control-icon" />
      </button>
      <button class="control-btn maximize" @click="api.maximize()">
        <span class="control-icon" />
      </button>
      <button class="control-btn close" @click="api.close()">
        <span class="control-icon" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px 0 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.app-name {
  font-family: var(--font-headline);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.title-bar-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.control-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.control-btn.close:hover {
  background: var(--error);
  color: #fff;
}

.control-icon {
  display: block;
  width: 10px;
  height: 10px;
  position: relative;
}

.minimize .control-icon::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 10px;
  height: 1.5px;
  background: currentColor;
  transform: translateY(-50%);
}

.maximize .control-icon::before,
.maximize .control-icon::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid currentColor;
}

.maximize .control-icon::before {
  left: 0;
  top: 0;
}

.maximize .control-icon::after {
  right: 0;
  bottom: 0;
  border-left: none;
  border-top: none;
  width: 4px;
  height: 4px;
}

.close .control-icon::before,
.close .control-icon::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 10px;
  height: 1.5px;
  background: currentColor;
}

.close .control-icon::before {
  transform: translateY(-50%) rotate(45deg);
}

.close .control-icon::after {
  transform: translateY(-50%) rotate(-45deg);
}
</style>
