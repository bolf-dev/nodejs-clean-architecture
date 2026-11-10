<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { listPlayerPredictions, type PlayerPrediction } from '@/api/predictions'

const props = defineProps<{
  playerId: string
  /** Shown when there is no prediction to show */
  emptyText: string
}>()

// The predictions of the current year's season, like the races screen
const season = new Date().getFullYear()

const loading = ref(true)
const predictions = ref<PlayerPrediction[]>([])
const errorMessage = ref<string | null>(null)

async function load(): Promise<void> {
  try {
    predictions.value = await listPlayerPredictions(props.playerId, season)
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  } finally {
    loading.value = false
  }
}

void load()
</script>

<template>
  <p v-if="loading" class="predictions__status">Loading…</p>
  <p v-else-if="errorMessage" class="predictions__status predictions__status--error" role="alert">
    {{ errorMessage }}
  </p>
  <p v-else-if="predictions.length === 0" class="predictions__status">{{ emptyText }}</p>
  <ol v-else class="predictions__list">
    <li v-for="prediction in predictions" :key="prediction.raceId">
      <RouterLink :to="`/races/${prediction.raceId}`" class="predictions__row">
        <span class="predictions__round">{{ prediction.round }}</span>
        <span class="predictions__race">{{ prediction.raceName }}</span>
        <span class="predictions__picks">
          <span>
            Quali
            <strong>{{ prediction.qualifying.p1 }} {{ prediction.qualifying.p2 }} {{ prediction.qualifying.p3 }}</strong>
          </span>
          <span>
            Race <strong>{{ prediction.race.p1 }} {{ prediction.race.p2 }} {{ prediction.race.p3 }}</strong>
          </span>
        </span>
      </RouterLink>
    </li>
  </ol>
</template>

<style scoped>
.predictions__status {
  color: var(--color-text-muted);
}

.predictions__status--error {
  color: var(--color-error);
}

.predictions__list {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  padding: 0;
  list-style: none;
}

/* Rows like the races screen */
.predictions__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-2) 0;
  background-color: var(--color-panel);
  border-left: var(--space-1) solid var(--color-panel-border);
  text-decoration: none;
}

.predictions__row:hover {
  border-left-color: var(--color-accent);
}

.predictions__round {
  min-width: 2.5em;
  padding: var(--space-1) 0;
  background-color: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.predictions__race {
  flex: 1;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.predictions__picks {
  display: flex;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  text-transform: uppercase;
}

.predictions__picks strong {
  color: var(--color-text);
  letter-spacing: 0.05em;
}
</style>
