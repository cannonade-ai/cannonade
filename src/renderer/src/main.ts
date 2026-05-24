import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from './stores/settings'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

await useSettingsStore().init()

app.mount('#app')
