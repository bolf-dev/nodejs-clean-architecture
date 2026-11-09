<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, GENERIC_ERROR } from '@/api/client'
import { logIn, sessionExpired } from '@/auth/session'

const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const emailId = useId()
const passwordId = useId()
const errorId = useId()

// Only empty fields are checked here, the rules stay in the backend
const canSubmit = computed(
  () => email.value.trim() !== '' && password.value !== '' && !submitting.value,
)

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) {
    return
  }
  submitting.value = true
  error.value = null
  try {
    await logIn(email.value, password.value)
    await router.push('/')
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : GENERIC_ERROR
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="auth-screen">
    <div class="auth-screen__flag checkered" aria-hidden="true"></div>
    <h1 class="auth-screen__title">Log in</h1>
    <p v-if="sessionExpired" class="auth-screen__expired" role="status">
      Your session has expired. Please log in again.
    </p>
    <form
      class="panel auth-screen__form"
      novalidate
      :aria-describedby="error ? errorId : undefined"
      @submit.prevent="onSubmit"
    >
      <label :for="emailId" class="form-label">Email</label>
      <input :id="emailId" v-model="email" class="form-input" type="email" autocomplete="email" />
      <label :for="passwordId" class="form-label">Password</label>
      <input
        :id="passwordId"
        v-model="password"
        class="form-input"
        type="password"
        autocomplete="current-password"
      />
      <p v-if="error" :id="errorId" class="form-error" role="alert">{{ error }}</p>
      <button type="submit" class="button-primary auth-screen__submit" :disabled="!canSubmit">
        {{ submitting ? 'Working…' : 'Log in' }}
      </button>
    </form>
    <p class="auth-screen__switch">
      No account yet? <RouterLink to="/register">Register</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.auth-screen {
  display: grid;
  gap: var(--space-4);
}

.auth-screen__flag {
  width: 96px;
  height: var(--space-4);
}

.auth-screen__title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-black);
  font-style: italic;
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.auth-screen__expired {
  font-weight: var(--font-weight-semibold);
}

.auth-screen__form {
  display: grid;
  gap: var(--space-2);
}

.auth-screen__submit {
  justify-self: start;
  margin-top: var(--space-3);
}

.auth-screen__switch {
  color: var(--color-text-muted);
}
</style>
