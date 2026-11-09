<template>
  <section class="not-found">
    <h1 class="not-found__title">Player not found</h1>
    <p class="not-found__text">There is no player with this id.</p>
    <RouterLink to="/" class="not-found__link">Go to my profile</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  gap: var(--space-4);
  justify-items: start;
}

.not-found__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.not-found__text {
  color: var(--color-text-muted);
}

.not-found__link {
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: 2px solid var(--color-accent);
}
</style>
