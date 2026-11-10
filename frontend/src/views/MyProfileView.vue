<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { changeMyNickname } from '@/api/players'
import { me, refreshCurrentPlayer } from '@/auth/session'
import NicknameForm from '@/components/NicknameForm.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import PredictionsList from '@/components/PredictionsList.vue'

const STATUS_DURATION_MS = 4000

const errorMessage = ref<string | null>(null)

const editing = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)
const statusMessage = ref('')
let statusTimer: ReturnType<typeof setTimeout> | undefined

async function load(): Promise<void> {
  // Already loaded after login or by App.vue after a page reload
  if (me.value !== null) {
    return
  }
  try {
    await refreshCurrentPlayer()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  }
}

function startEditing(): void {
  formError.value = null
  editing.value = true
}

async function onChangeNickname(nickname: string): Promise<void> {
  submitting.value = true
  formError.value = null
  try {
    await changeMyNickname(nickname)
    // Also updates the nickname in the header
    await refreshCurrentPlayer()
    editing.value = false
    showStatus('Nickname changed')
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : GENERIC_ERROR
  } finally {
    submitting.value = false
  }
}

function showStatus(message: string): void {
  clearTimeout(statusTimer)
  statusMessage.value = message
  statusTimer = setTimeout(() => (statusMessage.value = ''), STATUS_DURATION_MS)
}

onBeforeUnmount(() => clearTimeout(statusTimer))

void load()
</script>

<template>
  <p v-if="errorMessage" class="status status--error" role="alert">{{ errorMessage }}</p>
  <div v-else-if="me" class="profile">
    <PlayerCard :player="me" :email="me.email" />

    <!-- Always rendered, so screen readers announce the message when it appears -->
    <p class="profile__status" role="status">{{ statusMessage }}</p>

    <div v-if="editing" class="panel">
      <NicknameForm
        submit-label="Save"
        :submitting="submitting"
        :error="formError"
        :initial-value="me.nickname"
        cancellable
        @submit="onChangeNickname"
        @cancel="editing = false"
      />
    </div>
    <button v-else type="button" class="profile__change" @click="startEditing">
      Change nickname
    </button>

    <h2 class="profile__subtitle">My predictions</h2>
    <PredictionsList :player-id="me.id" empty-text="You have no predictions yet." />
  </div>
  <p v-else class="status">Loading…</p>
</template>

<style scoped>
.status {
  color: var(--color-text-muted);
}

.status--error {
  color: var(--color-error);
}

.profile {
  display: grid;
  gap: var(--space-4);
}

.profile__subtitle {
  margin-top: var(--space-4);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-black);
  font-style: italic;
  text-transform: uppercase;
}

.profile__status {
  min-height: 1.5em;
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
}

.profile__status:empty {
  min-height: 0;
}

/* Secondary action: outlined, slanted like the primary button */
.profile__change {
  justify-self: start;
  padding: var(--space-3) var(--space-5);
  background: none;
  border: 2px solid var(--color-accent);
  color: var(--color-text);
  font-weight: var(--font-weight-bold);
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}
</style>
