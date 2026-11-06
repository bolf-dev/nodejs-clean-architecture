<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
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
