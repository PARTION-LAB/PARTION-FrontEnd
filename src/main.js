import { createApp } from 'vue'
import { addVueError } from '@datadog/browser-rum-vue'
import './assets/style.css'
import App from './App.vue'
import { initDatadogRum } from './observability/datadogRum'
import router from './router'

initDatadogRum()

const app = createApp(App)

app.config.errorHandler = addVueError
app.use(router).mount('#app')
