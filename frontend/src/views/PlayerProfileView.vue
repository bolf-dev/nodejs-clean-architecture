<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { changeNickname, getPlayer, type Player } from '@/api/players'
import NicknameForm from '@/components/NicknameForm.vue'
import { formatDate } from '@/utils/format-date'
import PlayerNotFoundView from './PlayerNotFoundView.vue'

const STATUS_DURATION_MS = 4000

const props = defineProps<{ playerId: string }>()

const loading = ref(true)
const player = ref<Player | null>(null)
const notFound = ref(false)
const errorMessage = ref<string | null>(null)

const editing = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)
const statusMessage = ref('')
let statusTimer: ReturnType<typeof setTimeout> | undefined

async function load(): Promise<void> {
  try {
    player.value = await getPlayer(props.playerId)
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      notFound.value = true
    } else {
      errorMessage.value = error instanceof ApiError ? error.message : GENERIC_ERROR
    }
  } finally {
    loading.value = false
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
    await changeNickname(props.playerId, nickname)
    player.value = await getPlayer(props.playerId)
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
  <p v-if="loading" class="status">Loading…</p>
  <PlayerNotFoundView v-else-if="notFound" />
  <p v-else-if="errorMessage" class="status status--error" role="alert">{{ errorMessage }}</p>
  <div v-else-if="player" class="profile">
    <article class="player-card">
      <div class="player-card__flag checkered" aria-hidden="true"></div>
      <p class="player-card__label">Player</p>
      <h1 class="player-card__nickname">{{ player.nickname }}</h1>
      <dl class="player-card__dates">
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

    <!-- Always rendered, so screen readers announce the message when it appears -->
    <p class="profile__status" role="status">{{ statusMessage }}</p>

    <div v-if="editing" class="profile__panel">
      <NicknameForm
        submit-label="Save"
        :submitting="submitting"
        :error="formError"
        :initial-value="player.nickname"
        cancellable
        @submit="onChangeNickname"
        @cancel="editing = false"
      />
    </div>
    <button v-else type="button" class="profile__change" @click="startEditing">
      Change nickname
    </button>
  </div>
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

.profile__status {
  min-height: 1.5em;
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
}

.profile__status:empty {
  min-height: 0;
}

.profile__panel {
  max-width: 480px;
  padding: var(--space-5);
  background-color: var(--color-panel);
  border-left: var(--space-2) solid var(--color-accent);
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

.player-card__dates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  margin-top: var(--space-3);
}

.player-card__dates dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.player-card__dates dd {
  font-weight: var(--font-weight-semibold);
}
</style>
