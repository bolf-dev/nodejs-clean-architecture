import { createRouter, createWebHistory } from 'vue-router'
import PlayerProfileView from '@/views/PlayerProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/players/:playerId', component: PlayerProfileView, props: true }],
})

export default router
