<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Picks } from '@/api/predictions'
import type { Driver } from '@/api/races'
import DriverCard from './DriverCard.vue'

type Slot = keyof Picks

const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'pole', label: 'Pole' },
  { slot: 'p1', label: 'P1' },
  { slot: 'p2', label: 'P2' },
  { slot: 'p3', label: 'P3' },
]
const PODIUM: Slot[] = ['p1', 'p2', 'p3']

const props = defineProps<{
  drivers: Driver[]
  /** The saved prediction, loaded into the slots */
  initial: Picks | null
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{ submit: [picks: Picks] }>()

const picks = reactive<Record<Slot, string | null>>({
  pole: props.initial?.pole ?? null,
  p1: props.initial?.p1 ?? null,
  p2: props.initial?.p2 ?? null,
  p3: props.initial?.p3 ?? null,
})

const firstEmptySlot = () => SLOTS.find(({ slot }) => picks[slot] === null)?.slot
const active = ref<Slot>(firstEmptySlot() ?? 'pole')

const complete = computed(() => SLOTS.every(({ slot }) => picks[slot] !== null))

function pick(code: string): void {
  // A podium driver moves from their old podium slot, so P1, P2 and P3 stay different (R2)
  if (PODIUM.includes(active.value)) {
    for (const slot of PODIUM) {
      if (slot !== active.value && picks[slot] === code) {
        picks[slot] = null
      }
    }
  }
  picks[active.value] = code
  active.value = firstEmptySlot() ?? active.value
}

/** The slots a driver is in, e.g. "POLE · P2" */
function badgeOf(code: string): string | undefined {
  const labels = SLOTS.filter(({ slot }) => picks[slot] === code).map(({ label }) => label)
  return labels.length > 0 ? labels.join(' · ') : undefined
}

function onSubmit(): void {
  if (picks.pole && picks.p1 && picks.p2 && picks.p3) {
    emit('submit', { pole: picks.pole, p1: picks.p1, p2: picks.p2, p3: picks.p3 })
  }
}
</script>

<template>
  <form class="prediction-form" @submit.prevent="onSubmit">
    <div class="prediction-form__slots">
      <button
        v-for="{ slot, label } in SLOTS"
        :key="slot"
        type="button"
        class="prediction-form__slot"
        :class="{ 'prediction-form__slot--active': active === slot }"
        :aria-pressed="active === slot"
        @click="active = slot"
      >
        <span class="prediction-form__slot-label">{{ label }}</span>
        <span class="prediction-form__slot-code">{{ picks[slot] ?? '—' }}</span>
      </button>
    </div>

    <p class="prediction-form__hint">Pick a slot, then a driver.</p>

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

.prediction-form__slots {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.prediction-form__slot {
  display: grid;
  min-width: 88px;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-panel);
  border: 0;
  border-bottom: var(--space-1) solid var(--color-panel-border);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.prediction-form__slot--active {
  border-bottom-color: var(--color-accent);
}

.prediction-form__slot-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.prediction-form__slot-code {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-black);
  font-style: italic;
  letter-spacing: 0.05em;
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
