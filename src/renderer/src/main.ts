import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from './stores/settings'
import { useAppInfoStore } from './stores/app-info'
import { useUpdaterStore } from './stores/updater'
import { vTooltip } from './directives/tooltip'
import { createLogger } from './utils/logger'

const log = createLogger('renderer-main')
const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.directive('tooltip', vTooltip)

log.info('Renderer script running, initializing stores')
await Promise.all([useSettingsStore().init(), useAppInfoStore().init(), useUpdaterStore().init()])

app.mount('#app')
log.info('Main renderer mounted')
