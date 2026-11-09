import { computed, ref } from 'vue'
import { logIn as requestToken } from '@/api/auth'
import { getMe, registerPlayer, type MyPlayer } from '@/api/players'
import { clearToken, readToken, saveToken } from './token-storage'

// Module state shared by every component that imports it, so no store library is needed
const token = ref(readToken())
const currentPlayer = ref<MyPlayer | null>(null)

/** Whether a player is logged in. The token stays until it expires or the player logs out. */
export const isLoggedIn = computed(() => token.value !== null)

/** The logged-in player, loaded with `refreshCurrentPlayer()`. */
export const me = computed(() => currentPlayer.value)

export async function logIn(email: string, password: string): Promise<void> {
  const issued = await requestToken(email, password)
  saveToken(issued)
  token.value = issued
  await refreshCurrentPlayer()
}

/** Registers a player and logs them in right away. */
export async function register(email: string, nickname: string, password: string): Promise<void> {
  await registerPlayer(email, nickname, password)
  await logIn(email, password)
}

/** Only forgets the token in the browser; the API keeps no sessions (R11). */
export function logOut(): void {
  clearToken()
  token.value = null
  currentPlayer.value = null
}

export async function refreshCurrentPlayer(): Promise<void> {
  currentPlayer.value = await getMe()
}
