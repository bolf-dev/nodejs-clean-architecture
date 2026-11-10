<script setup lang="ts">
import type { Driver } from '@/api/races'
import { teamColor } from '@/utils/team-colors'

// The badge shows the prediction slots of the driver, e.g. "POLE · P2"
defineProps<{ driver: Driver; badge?: string }>()
</script>

<template>
  <article class="driver-card" :style="{ '--team-color': teamColor(driver.team?.id) }">
    <span class="driver-card__number">{{ driver.number }}</span>
    <span class="driver-card__code">{{ driver.code }}</span>
    <p class="driver-card__name">
      {{ driver.firstName }} <strong>{{ driver.lastName }}</strong>
    </p>
    <span v-if="badge" class="driver-card__badge">{{ badge }}</span>
  </article>
</template>

<style scoped>
/* Dark panel with a stripe in the team color on the side, cut top right corner */
.driver-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-panel);
  border-left: var(--space-2) solid var(--team-color);
  clip-path: polygon(
    0 0,
    calc(100% - var(--corner-cut)) 0,
    100% var(--corner-cut),
    100% 100%,
    0 100%
  );
}

.driver-card__number {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
}

.driver-card__code {
  justify-self: end;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.1em;
}

.driver-card__name {
  grid-column: 1 / -1;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.driver-card__name strong {
  font-weight: var(--font-weight-bold);
}

.driver-card__badge {
  grid-column: 1 / -1;
  justify-self: start;
  padding: 0 var(--space-2);
  background-color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}
</style>
