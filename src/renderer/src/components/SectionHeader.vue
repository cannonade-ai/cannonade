<script setup lang="ts"></script>

<template>
  <div class="section-header">
    <div class="section-actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: end;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
