<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconTank, IconPlus } from '@tabler/icons-vue'
import Button from '@renderer/components/ui/Button.vue'
import AddProviderModal from '@renderer/components/add-provider-modal/AddProviderModal.vue'
import { useSettingsStore } from '@renderer/stores/settings'

const settings = useSettingsStore()

const showModal = ref(false)

watch(showModal, (open) => {
  if (!open && settings.configuredProviders.length > 0) {
    settings.completeOnboarding()
  }
})

function skip(): void {
  settings.completeOnboarding()
}
</script>

<template>
  <div class="onboarding">
    <div class="onboarding-card">
      <div class="logo">
        <IconTank color="rgb(151, 106, 0)" :size="48" :stroke-width="1" />
      </div>

      <h1 class="title">Cannonade</h1>
      <p class="subtitle">
        Design test suites, run them across models, compare results. Evaluate, compare, decide.
      </p>

      <div class="actions">
        <Button type="primary" @click="showModal = true">
          <IconPlus :size="16" />
          Add your first provider
        </Button>
      </div>

      <button class="skip" @click="skip">Skip for now</button>
    </div>

    <AddProviderModal v-model="showModal" />
  </div>
</template>

<style scoped lang="scss">
.onboarding {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  width: 100%;
  background: var(--bg);
}

.onboarding-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  max-width: 450px;
  width: 100%;
}

.logo {
  margin-bottom: 4px;
}

.title {
  font-family: var(--font-headline);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
}

.skip {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 4px;
  transition: color 0.15s;

  &:hover {
    color: var(--text-secondary);
  }
}
</style>
