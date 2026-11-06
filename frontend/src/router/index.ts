import { createRouter, createWebHistory } from 'vue-router'
import CreatePlayerView from '@/views/CreatePlayerView.vue'
import PlayerProfileView from '@/views/PlayerProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: CreatePlayerView },
    { path: '/players/:playerId', component: PlayerProfileView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
