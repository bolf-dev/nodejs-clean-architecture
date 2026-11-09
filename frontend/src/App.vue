<script setup lang="ts">
import { isLoggedIn, refreshCurrentPlayer } from '@/auth/session'
import AppHeader from '@/components/AppHeader.vue'

// After a page reload the token is still stored, so load who is logged in for the header
if (isLoggedIn.value) {
  refreshCurrentPlayer().catch(() => {
    // The header then shows no nickname; the screens report their own errors
  })
}
</script>

<template>
  <AppHeader />
  <main class="app-content">
    <RouterView />
  </main>
</template>

<style scoped>
.app-content {
  max-width: var(--content-max-width);
  margin-inline: auto;
  padding: var(--space-6) var(--space-4);
}
</style>
