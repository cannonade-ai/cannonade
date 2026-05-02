<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="panel">
    <div class="panel__header">
      <div class="panel__header-left">
        <span class="panel__title">{{ title }}</span>
        <slot name="title-addon" />
      </div>
      <div class="panel__header-right">
        <slot name="header-right" />
      </div>
    </div>

    <div v-if="$slots.toolbar" class="panel__toolbar">
      <slot name="toolbar" />
    </div>

    <div class="panel__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="panel__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 2px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
    height: 3rem;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__title {
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: var(--font-headline);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--accent);
  }

  &__toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    gap: 0.5rem;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
}
</style>
