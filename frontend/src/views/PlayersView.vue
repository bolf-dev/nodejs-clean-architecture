<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { listPlayers, type PlayerListItem } from '@/api/players'
import { me } from '@/auth/session'

const loading = ref(true)
const players = ref<PlayerListItem[]>([])
const errorMessage = ref<string | null>(null)

async function load(): Promise<void> {
  try {
    players.value = await listPlayers()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  } finally {
    loading.value = false
  }
}

void load()
</script>

<template>
  <section class="players">
    <div class="players__flag checkered" aria-hidden="true"></div>
    <h1 class="players__title">Players</h1>

    <p v-if="loading" class="players__status">Loading…</p>
    <p v-else-if="errorMessage" class="players__status players__status--error" role="alert">
      {{ errorMessage }}
    </p>
    <!-- Rows like the timing tower: position number, nickname -->
    <ol v-else class="players__tower">
      <li v-for="(player, index) in players" :key="player.id">
        <RouterLink
          :to="player.id === me?.id ? '/' : `/players/${player.id}`"
          class="players__row"
          :class="{ 'players__row--me': player.id === me?.id }"
        >
          <span class="players__position">{{ index + 1 }}</span>
          <span class="players__nickname">{{ player.nickname }}</span>
          <span v-if="player.id === me?.id" class="players__you">You</span>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.players {
  display: grid;
  gap: var(--space-4);
}

.players__flag {
  width: 96px;
  height: var(--space-4);
}

.players__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.players__status {
  color: var(--color-text-muted);
}

.players__status--error {
  color: var(--color-error);
}

.players__tower {
  display: grid;
  gap: var(--space-1);
  max-width: 480px;
  padding: 0;
  list-style: none;
}

.players__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-2) 0;
  background-color: var(--color-panel);
  border-left: var(--space-1) solid var(--color-panel-border);
  text-decoration: none;
}

.players__row:hover,
.players__row--me {
  border-left-color: var(--color-accent);
}

.players__position {
  min-width: 2.5em;
  padding: var(--space-1) 0;
  background-color: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.players__nickname {
  flex: 1;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.players__you {
  padding: 0 var(--space-2);
  background-color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}
</style>
