<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { listRaces, type Race } from '@/api/races'
import { formatDate } from '@/utils/format-date'

// The calendar of the current year's season; choosing another season is out of scope
const season = new Date().getFullYear()
const now = Date.now()

const loading = ref(true)
const races = ref<Race[]>([])
const errorMessage = ref<string | null>(null)

const isPast = (race: Race) => new Date(race.raceAt).getTime() < now

async function load(): Promise<void> {
  try {
    races.value = await listRaces(season)
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  } finally {
    loading.value = false
  }
}

void load()
</script>

<template>
  <section class="races">
    <div class="races__flag checkered" aria-hidden="true"></div>
    <h1 class="races__title">{{ season }} Races</h1>

    <p v-if="loading" class="races__status">Loading…</p>
    <p v-else-if="errorMessage" class="races__status races__status--error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="races.length === 0" class="races__status">
      The {{ season }} season has no races yet.
    </p>
    <ol v-else class="races__list">
      <li v-for="race in races" :key="race.id">
        <RouterLink
          :to="`/races/${race.id}`"
          class="races__row"
          :class="{ 'races__row--past': isPast(race) }"
        >
          <span class="races__round">{{ race.round }}</span>
          <span class="races__name">
            {{ race.name }}
            <span class="races__country">{{ race.country }}</span>
          </span>
          <time class="races__date" :datetime="race.raceAt">{{ formatDate(race.raceAt) }}</time>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.races {
  display: grid;
  gap: var(--space-4);
}

.races__flag {
  width: 96px;
  height: var(--space-4);
}

.races__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.races__status {
  color: var(--color-text-muted);
}

.races__status--error {
  color: var(--color-error);
}

.races__list {
  display: grid;
  gap: var(--space-1);
  padding: 0;
  list-style: none;
}

.races__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-2) 0;
  background-color: var(--color-panel);
  border-left: var(--space-1) solid var(--color-panel-border);
  text-decoration: none;
}

.races__row:hover {
  border-left-color: var(--color-accent);
}

.races__row--past {
  opacity: 0.5;
}

.races__round {
  min-width: 2.5em;
  padding: var(--space-1) 0;
  background-color: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.races__name {
  flex: 1;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.races__country {
  margin-left: var(--space-2);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.races__date {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
</style>
