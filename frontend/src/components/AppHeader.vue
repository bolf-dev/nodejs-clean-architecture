<script setup lang="ts">
import { useRouter } from 'vue-router'
import { isLoggedIn, logOut, me } from '@/auth/session'

const router = useRouter()

async function onLogOut(): Promise<void> {
  logOut()
  await router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink to="/" class="app-header__name">
        <span class="app-header__stripe" aria-hidden="true"></span>
        F1 Prediction League
      </RouterLink>
      <div v-if="isLoggedIn" class="app-header__session">
        <RouterLink to="/players" class="app-header__link">Players</RouterLink>
        <RouterLink v-if="me" to="/" class="app-header__player">{{ me.nickname }}</RouterLink>
        <button type="button" class="app-header__logout" @click="onLogOut">Log out</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: var(--color-panel);
  border-bottom: 1px solid var(--color-panel-border);
}

.app-header__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  max-width: var(--content-max-width);
  margin-inline: auto;
  padding: var(--space-3) var(--space-4);
}

.app-header__name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
  text-decoration: none;
  letter-spacing: 0.02em;
}

/* Red slanted stripe in front of the app name */
.app-header__stripe {
  flex-shrink: 0;
  width: var(--space-2);
  height: 1.5em;
  background-color: var(--color-accent);
  transform: skewX(var(--slant));
}

.app-header__session {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.app-header__link {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
}

.app-header__player {
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.app-header__logout {
  padding: var(--space-1) var(--space-3);
  background: none;
  border: 1px solid var(--color-panel-border);
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}
</style>
