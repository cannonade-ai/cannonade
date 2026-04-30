<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <span class="toggle">
    <input v-model="model" type="checkbox" class="toggle__input" />
    <span class="toggle__track" />
  </span>
</template>

<style scoped lang="scss">
.toggle {
  position: relative;
  flex-shrink: 0;

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__track {
    display: block;
    width: 32px;
    height: 18px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    transition:
      background 0.15s,
      border-color 0.15s;
    position: relative;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--text-muted);
      transition:
        transform 0.15s,
        background 0.15s;
    }
  }

  &__input:checked + &__track {
    background: var(--accent-dim);
    border-color: var(--accent-border);

    &::after {
      transform: translateX(14px);
      background: var(--accent);
    }
  }
}
</style>
