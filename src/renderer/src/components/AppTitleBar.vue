<script setup lang="ts">
import { computed } from 'vue'
import { api } from '../api'
import { useTestRunsStore } from '@renderer/stores/test-runs'
import { useConfirmStore } from '@renderer/stores/confirm'

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__

const testRunsStore = useTestRunsStore()
const confirmStore = useConfirmStore()

const hasRunningRun = computed(() => testRunsStore.runs.some((r) => r.status === 'running'))

async function handleClose(): Promise<void> {
  if (hasRunningRun.value) {
    const confirmed = await confirmStore.confirm({
      title: 'Quit Cannonade?',
      message: 'A test run is currently in progress. Quitting now will stop it.',
      confirmText: 'Quit anyway',
      danger: true
    })
    if (!confirmed) return
  }
  api.close()
}
</script>

<template>
  <header class="title-bar">
    <div class="left" />
    <div class="center">
      <span class="app-name">Cannonade</span>
      <span class="app-version">v{{ appVersion }}</span>
    </div>
    <div class="right">
      <button class="control-btn minimize" @click="api.minimize()">
        <span class="control-icon" />
      </button>
      <button class="control-btn maximize" @click="api.maximize()">
        <span class="control-icon" />
      </button>
      <button class="control-btn close" @click="handleClose">
        <span class="control-icon" />
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: 2.5rem;
  padding-left: 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;

  .left,
  .center {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
  }

  .center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 4px;
    -webkit-app-region: no-drag;
  }
}

.app-name {
  font-family: var(--font-headline);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.app-version {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 1px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s;

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &.close:hover {
    background: var(--error);
    color: #fff;
  }
}

.control-icon {
  display: block;
  width: 10px;
  height: 10px;
  position: relative;
}

.minimize .control-icon {
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 10px;
    height: 1.5px;
    background: currentColor;
    transform: translateY(-50%);
  }
}

.maximize .control-icon {
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1.5px solid currentColor;
  }

  &::before {
    left: 0;
    top: 0;
  }

  &::after {
    right: 0;
    bottom: 0;
    border-left: none;
    border-top: none;
    width: 4px;
    height: 4px;
  }
}

.close .control-icon {
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 10px;
    height: 1.5px;
    background: currentColor;
  }

  &::before {
    transform: translateY(-50%) rotate(45deg);
  }

  &::after {
    transform: translateY(-50%) rotate(-45deg);
  }
}
</style>
