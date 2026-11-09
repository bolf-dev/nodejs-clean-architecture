import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/auth/session'
import LoginView from '@/views/LoginView.vue'
import MyProfileView from '@/views/MyProfileView.vue'
import PlayerProfileView from '@/views/PlayerProfileView.vue'
import PlayersView from '@/views/PlayersView.vue'
import RacesView from '@/views/RacesView.vue'
import RaceView from '@/views/RaceView.vue'
import RegisterView from '@/views/RegisterView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** A screen for logged-out visitors: login and registration */
    public?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/register', component: RegisterView, meta: { public: true } },
    { path: '/', component: MyProfileView },
    { path: '/players', component: PlayersView },
    { path: '/players/:playerId', component: PlayerProfileView, props: true },
    { path: '/races', component: RacesView },
    { path: '/races/:raceId', component: RaceView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Logged-out visitors only see login and registration, logged-in players never see them
router.beforeEach((to) => {
  if (!to.meta.public && !isLoggedIn.value) {
    return '/login'
  }
  if (to.meta.public && isLoggedIn.value) {
    return '/'
  }
})

export default router
