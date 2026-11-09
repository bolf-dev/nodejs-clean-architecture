<script setup lang="ts">
import type { Player } from '@/api/players'
import { formatDate } from '@/utils/format-date'

// The email is passed only for the logged-in player's own card
defineProps<{ player: Player; email?: string }>()
</script>

<template>
  <article class="player-card">
    <div class="player-card__flag checkered" aria-hidden="true"></div>
    <p class="player-card__label">Player</p>
    <h1 class="player-card__nickname">{{ player.nickname }}</h1>
    <dl class="player-card__details">
      <div v-if="email">
        <dt>Email</dt>
        <dd>{{ email }}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>
          <time :datetime="player.createdAt">{{ formatDate(player.createdAt) }}</time>
        </dd>
      </div>
      <div>
        <dt>Last change</dt>
        <dd>
          <time :datetime="player.updatedAt">{{ formatDate(player.updatedAt) }}</time>
        </dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
/* Timing tower card: dark panel, red accent bar on the side, cut top right corner */
.player-card {
  position: relative;
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-5) var(--space-5) var(--space-6);
  background-color: var(--color-panel);
  border-left: var(--space-2) solid var(--color-accent);
  clip-path: polygon(
    0 0,
    calc(100% - var(--corner-cut)) 0,
    100% var(--corner-cut),
    100% 100%,
    0 100%
  );
}

.player-card__flag {
  position: absolute;
  top: 0;
  right: 0;
  width: 64px;
  height: var(--space-4);
}

.player-card__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.player-card__nickname {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.player-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  margin-top: var(--space-3);
}

.player-card__details dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.player-card__details dd {
  font-weight: var(--font-weight-semibold);
  overflow-wrap: anywhere;
}
</style>
