<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { createPlayer } from '@/api/players'
import NicknameForm from '@/components/NicknameForm.vue'

const router = useRouter()

const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit(nickname: string): Promise<void> {
  submitting.value = true
  error.value = null
  try {
    const { id } = await createPlayer(nickname)
    await router.push(`/players/${id}`)
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : GENERIC_ERROR
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="create-player">
    <div class="create-player__intro">
      <div class="create-player__flag checkered" aria-hidden="true"></div>
      <h1 class="create-player__title">Predict the race</h1>
      <p class="create-player__text">
        Pick the pole position and the podium before every Grand Prix and score points after the
        race. Choose a nickname to join the league.
      </p>
    </div>
    <div class="create-player__panel">
      <NicknameForm
        submit-label="Create player"
        :submitting="submitting"
        :error="error"
        @submit="onSubmit"
      />
    </div>
  </section>
</template>

<style scoped>
.create-player {
  display: grid;
  gap: var(--space-6);
}

.create-player__intro {
  display: grid;
  gap: var(--space-3);
}

.create-player__flag {
  width: 96px;
  height: var(--space-4);
}

.create-player__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.create-player__text {
  max-width: 60ch;
  color: var(--color-text-muted);
}

/* Panel like a TV info graphic: red accent bar on the side, cut top right corner */
.create-player__panel {
  max-width: 480px;
  padding: var(--space-5);
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
</style>
