<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink to="/" class="app-header__name">
        <span class="app-header__stripe" aria-hidden="true"></span>
        F1 Prediction League
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: var(--color-panel);
  border-bottom: 1px solid var(--color-panel-border);
}

.app-header__inner {
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
</style>
