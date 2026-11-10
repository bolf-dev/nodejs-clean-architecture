<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { getPlayer, type Player } from '@/api/players'
import PlayerCard from '@/components/PlayerCard.vue'
import PredictionsList from '@/components/PredictionsList.vue'
import PlayerNotFoundView from './PlayerNotFoundView.vue'

const props = defineProps<{ playerId: string }>()

const loading = ref(true)
const player = ref<Player | null>(null)
const notFound = ref(false)
const errorMessage = ref<string | null>(null)

async function load(): Promise<void> {
  try {
    player.value = await getPlayer(props.playerId)
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      notFound.value = true
    } else {
      errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
    }
  } finally {
    loading.value = false
  }
}

void load()
</script>

<template>
  <p v-if="loading" class="status">Loading…</p>
  <PlayerNotFoundView v-else-if="notFound" />
  <p v-else-if="errorMessage" class="status status--error" role="alert">{{ errorMessage }}</p>
  <!-- Another player's profile is read only and never shows the email -->
  <div v-else-if="player" class="profile">
    <PlayerCard :player="player" />
    <h2 class="profile__subtitle">Predictions</h2>
    <PredictionsList
      :player-id="player.id"
      empty-text="The predictions of other players are shown after the race."
    />
  </div>
</template>

<style scoped>
.profile {
  display: grid;
  gap: var(--space-4);
}

.profile__subtitle {
  margin-top: var(--space-4);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-black);
  font-style: italic;
  text-transform: uppercase;
}

.status {
  color: var(--color-text-muted);
}

.status--error {
  color: var(--color-error);
}
</style>
