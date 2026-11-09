<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { register } from '@/auth/session'

const router = useRouter()

const email = ref('')
const nickname = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const emailId = useId()
const nicknameId = useId()
const passwordId = useId()
const errorId = useId()

// Only empty fields are checked here, the rules stay in the backend
const canSubmit = computed(
  () =>
    email.value.trim() !== '' &&
    nickname.value.trim() !== '' &&
    password.value !== '' &&
    !submitting.value,
)

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) {
    return
  }
  submitting.value = true
  error.value = null
  try {
    await register(email.value, nickname.value, password.value)
    await router.push('/')
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : GENERIC_ERROR
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="register">
    <div class="register__intro">
      <div class="register__flag checkered" aria-hidden="true"></div>
      <h1 class="register__title">Predict the race</h1>
      <p class="register__text">
        Pick the pole position and the podium before every Grand Prix and score points after the
        race. Register to join the league.
      </p>
    </div>
    <form
      class="panel register__form"
      novalidate
      :aria-describedby="error ? errorId : undefined"
      @submit.prevent="onSubmit"
    >
      <label :for="emailId" class="form-label">Email</label>
      <input :id="emailId" v-model="email" class="form-input" type="email" autocomplete="email" />
      <label :for="nicknameId" class="form-label">Nickname</label>
      <input
        :id="nicknameId"
        v-model="nickname"
        class="form-input"
        type="text"
        autocomplete="username"
      />
      <label :for="passwordId" class="form-label">Password</label>
      <input
        :id="passwordId"
        v-model="password"
        class="form-input"
        type="password"
        autocomplete="new-password"
      />
      <p v-if="error" :id="errorId" class="form-error" role="alert">{{ error }}</p>
      <button type="submit" class="button-primary register__submit" :disabled="!canSubmit">
        {{ submitting ? 'Working…' : 'Register' }}
      </button>
    </form>
    <p class="register__switch">Already registered? <RouterLink to="/login">Log in</RouterLink></p>
  </section>
</template>

<style scoped>
.register {
  display: grid;
  gap: var(--space-5);
}

.register__intro {
  display: grid;
  gap: var(--space-3);
}

.register__flag {
  width: 96px;
  height: var(--space-4);
}

.register__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.register__text {
  max-width: 60ch;
  color: var(--color-text-muted);
}

.register__form {
  display: grid;
  gap: var(--space-2);
}

.register__submit {
  justify-self: start;
  margin-top: var(--space-3);
}

.register__switch {
  color: var(--color-text-muted);
}
</style>
