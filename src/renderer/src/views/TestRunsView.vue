<script setup lang="ts">
import { IconPlayerPlay } from '@tabler/icons-vue'
</script>

<template>
  <div class="empty-view">
    <IconPlayerPlay :size="32" :stroke-width="1.5" class="empty-icon" />
    <p class="empty-title">Test Runs</p>
    <p class="empty-sub">Coming soon</p>
  </div>
</template>

<style scoped>
.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-muted);
  padding: 40px;
}

.empty-icon {
  opacity: 0.4;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-headline);
  color: var(--text-secondary);
}

.empty-sub {
  font-size: 0.8rem;
}
</style>
