<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { getMyPrediction, submitMyPrediction, type Picks } from '@/api/predictions'
import { getRace, listDrivers, type Driver, type Race } from '@/api/races'
import PredictionForm from '@/components/PredictionForm.vue'
import { formatDate } from '@/utils/format-date'

const props = defineProps<{ raceId: string }>()

const loading = ref(true)
const race = ref<Race | null>(null)
const drivers = ref<Driver[]>([])
const notFound = ref(false)
const errorMessage = ref<string | null>(null)
const myPrediction = ref<Picks | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const statusMessage = ref('')

async function load(): Promise<void> {
  try {
    race.value = await getRace(props.raceId)
    const [seasonDrivers, prediction] = await Promise.all([
      listDrivers(race.value.season),
      getMyPrediction(props.raceId),
    ])
    drivers.value = seasonDrivers
    myPrediction.value = prediction
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

async function onSubmit(picks: Picks): Promise<void> {
  submitting.value = true
  formError.value = null
  statusMessage.value = ''
  try {
    await submitMyPrediction(props.raceId, picks)
    statusMessage.value = 'Prediction saved'
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  } finally {
    submitting.value = false
  }
}

void load()
</script>

<template>
  <p v-if="loading" class="race__status">Loading…</p>
  <section v-else-if="notFound" class="race">
    <h1 class="race__title">Race not found</h1>
    <p class="race__status">There is no race with this id.</p>
    <RouterLink to="/races" class="race__link">Go to the races</RouterLink>
  </section>
  <p v-else-if="errorMessage" class="race__status race__status--error" role="alert">
    {{ errorMessage }}
  </p>
  <section v-else-if="race" class="race">
    <div class="race__flag checkered" aria-hidden="true"></div>
    <p class="race__label">Round {{ race.round }} · {{ race.season }}</p>
    <h1 class="race__title">{{ race.name }}</h1>
    <p class="race__place">{{ race.circuit }}, {{ race.locality }}, {{ race.country }}</p>

    <!-- Session times in the user's local time zone (B5 of 003) -->
    <dl class="race__sessions">
      <div v-if="race.sprintQualifyingAt">
        <dt>Sprint qualifying</dt>
        <dd>
          <time :datetime="race.sprintQualifyingAt">{{ formatDate(race.sprintQualifyingAt) }}</time>
        </dd>
      </div>
      <div>
        <dt>Qualifying</dt>
        <dd>
          <time :datetime="race.qualifyingAt">{{ formatDate(race.qualifyingAt) }}</time>
        </dd>
      </div>
      <div>
        <dt>Race</dt>
        <dd>
          <time :datetime="race.raceAt">{{ formatDate(race.raceAt) }}</time>
        </dd>
      </div>
    </dl>

    <h2 class="race__subtitle">Your prediction</h2>
    <p v-if="drivers.length === 0" class="race__status">The season has no drivers yet.</p>
    <PredictionForm
      v-else
      :drivers="drivers"
      :initial="myPrediction"
      :submitting="submitting"
      :error="formError"
      @submit="onSubmit"
    />
    <!-- Always rendered, so screen readers announce the message when it appears -->
    <p class="race__saved" role="status">{{ statusMessage }}</p>
  </section>
</template>

<style scoped>
.race {
  display: grid;
  gap: var(--space-4);
  justify-items: start;
}

.race__flag {
  width: 96px;
  height: var(--space-4);
}

.race__label,
.race__sessions dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.race__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.race__place,
.race__status {
  color: var(--color-text-muted);
}

.race__status--error {
  color: var(--color-error);
}

.race__link {
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: 2px solid var(--color-accent);
}

.race__sessions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
}

.race__sessions dd {
  font-weight: var(--font-weight-semibold);
}

.race__subtitle {
  margin-top: var(--space-4);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-black);
  font-style: italic;
  text-transform: uppercase;
}

.race__saved {
  font-weight: var(--font-weight-semibold);
}
</style>
