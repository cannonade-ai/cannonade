import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from './stores/settings'
import { vTooltip } from './directives/tooltip'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.directive('tooltip', vTooltip)

await useSettingsStore().init()

app.mount('#app')
