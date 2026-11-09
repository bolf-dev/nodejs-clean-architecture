import './assets/styles/base.css'

import { createApp } from 'vue'
import { onUnauthorized } from './api/client'
import App from './App.vue'
import { expireSession } from './auth/session'
import router from './router'

// Wired here, so the API client knows neither the session nor the router
onUnauthorized(() => {
  expireSession()
  void router.push('/login')
})

const app = createApp(App)

app.use(router)

app.mount('#app')
