<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Picks, Podium } from '@/api/predictions'
import type { Driver } from '@/api/races'
import DriverCard from './DriverCard.vue'

type Session = keyof Picks
type Position = keyof Podium

interface Step {
  session: Session
  position: Position
  /** Shown on the step */
  label: string
  /** Shown on the card of the driver on the step */
  badge: string
}

const step = (session: Session, position: Position, label: string, badge: string): Step => ({
  session,
  position,
  label,
  badge,
})

// In the order the steps are filled: qualifying first, then the race
const STEPS: Step[] = [
  step('qualifying', 'p1', 'Pole', 'Pole'),
  step('qualifying', 'p2', 'P2', 'Quali P2'),
  step('qualifying', 'p3', 'P3', 'Quali P3'),
  step('race', 'p1', 'P1', 'Race P1'),
  step('race', 'p2', 'P2', 'Race P2'),
  step('race', 'p3', 'P3', 'Race P3'),
]

const PODIUMS: { session: Session; title: string }[] = [
  { session: 'qualifying', title: 'Qualifying' },
  { session: 'race', title: 'Race' },
]

// A podium shows P2 on the left, P1 in the middle and P3 on the right
const PODIUM_ORDER: Position[] = ['p2', 'p1', 'p3']

const props = defineProps<{
  drivers: Driver[]
  /** The saved prediction, loaded onto the steps */
  initial: Picks | null
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{ submit: [picks: Picks] }>()

const picks = reactive<Record<Session, Record<Position, string | null>>>({
  qualifying: {
    p1: props.initial?.qualifying.p1 ?? null,
    p2: props.initial?.qualifying.p2 ?? null,
    p3: props.initial?.qualifying.p3 ?? null,
  },
  race: {
    p1: props.initial?.race.p1 ?? null,
    p2: props.initial?.race.p2 ?? null,
    p3: props.initial?.race.p3 ?? null,
  },
})

const codeOn = (step: Step) => picks[step.session][step.position]
const indexOf = (session: Session, position: Position) =>
  STEPS.findIndex((step) => step.session === session && step.position === position)
const labelOf = (session: Session, position: Position) => STEPS[indexOf(session, position)]?.label

const firstEmptyStep = () => STEPS.findIndex((step) => codeOn(step) === null)
/** The index of the active step in STEPS */
const active = ref(Math.max(firstEmptyStep(), 0))

const complete = computed(() => STEPS.every((step) => codeOn(step) !== null))

function pick(code: string): void {
  const step = STEPS[active.value]!
  const podium = picks[step.session]
  // A driver moves from their old step of the same podium, so its three drivers stay different (R2)
  for (const position of PODIUM_ORDER) {
    if (podium[position] === code) {
      podium[position] = null
    }
  }
  podium[step.position] = code
  const next = firstEmptyStep()
  if (next !== -1) {
    active.value = next
  }
}

/** The steps a driver is on, e.g. "Pole · Race P2" */
function badgeOf(code: string): string | undefined {
  const badges = STEPS.filter((step) => codeOn(step) === code).map(({ badge }) => badge)
  return badges.length > 0 ? badges.join(' · ') : undefined
}

function onSubmit(): void {
  const { qualifying, race } = picks
  if (complete.value) {
    emit('submit', {
      qualifying: { p1: qualifying.p1!, p2: qualifying.p2!, p3: qualifying.p3! },
      race: { p1: race.p1!, p2: race.p2!, p3: race.p3! },
    })
  }
}
</script>

<template>
  <form class="prediction-form" @submit.prevent="onSubmit">
    <div class="prediction-form__podiums">
      <section v-for="{ session, title } in PODIUMS" :key="session" class="prediction-form__podium">
        <h3 class="prediction-form__podium-title">{{ title }}</h3>
        <div class="prediction-form__steps">
          <button
            v-for="position in PODIUM_ORDER"
            :key="position"
            type="button"
            class="prediction-form__step"
            :class="[
              `prediction-form__step--${position}`,
              { 'prediction-form__step--active': active === indexOf(session, position) },
            ]"
            :aria-pressed="active === indexOf(session, position)"
            @click="active = indexOf(session, position)"
          >
            <span class="prediction-form__step-code">{{ picks[session][position] ?? '—' }}</span>
            <span class="prediction-form__step-label">{{ labelOf(session, position) }}</span>
          </button>
        </div>
      </section>
    </div>

    <p class="prediction-form__hint">Pick a step, then a driver.</p>

    <ul class="prediction-form__drivers">
      <li v-for="driver in drivers" :key="driver.id">
        <button type="button" class="prediction-form__driver" @click="pick(driver.code)">
          <DriverCard :driver="driver" :badge="badgeOf(driver.code)" />
        </button>
      </li>
    </ul>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button type="submit" class="button-primary" :disabled="!complete || submitting">
      Save prediction
    </button>
  </form>
</template>

<style scoped>
.prediction-form {
  display: grid;
  gap: var(--space-4);
  justify-items: start;
  width: 100%;
}

.prediction-form__podiums {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}

.prediction-form__podium {
  display: grid;
  gap: var(--space-2);
}

.prediction-form__podium-title {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* The three steps stand on one line, the middle one is the highest */
.prediction-form__steps {
  display: grid;
  grid-template-columns: repeat(3, 88px);
  align-items: end;
  gap: var(--space-1);
}

.prediction-form__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-1);
  background-color: var(--color-panel);
  border: 0;
  border-top: var(--space-1) solid var(--color-panel-border);
  color: var(--color-text);
  cursor: pointer;
}

.prediction-form__step--p1 {
  height: 112px;
}

.prediction-form__step--p2 {
  height: 88px;
}

.prediction-form__step--p3 {
  height: 72px;
}

.prediction-form__step--active {
  border-top-color: var(--color-accent);
}

.prediction-form__step-code {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-black);
  font-style: italic;
  letter-spacing: 0.05em;
}

.prediction-form__step-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.prediction-form__hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.prediction-form__drivers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
  width: 100%;
  padding: 0;
  list-style: none;
}

.prediction-form__driver {
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.prediction-form__driver:hover {
  filter: brightness(1.25);
}
</style>
