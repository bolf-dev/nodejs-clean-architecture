<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = defineProps<{
  submitLabel: string
  submitting: boolean
  error: string | null
  initialValue?: string
  cancellable?: boolean
}>()

const emit = defineEmits<{ submit: [nickname: string]; cancel: [] }>()

const nickname = ref(props.initialValue ?? '')
const inputId = useId()
const errorId = useId()

// The only check in the frontend (B3), all nickname rules stay in the backend (B1)
const canSubmit = computed(() => nickname.value.trim() !== '' && !props.submitting)

function onSubmit(): void {
  if (canSubmit.value) {
    emit('submit', nickname.value)
  }
}
</script>

<template>
  <form class="nickname-form" novalidate @submit.prevent="onSubmit">
    <label :for="inputId" class="form-label">Nickname</label>
    <input
      :id="inputId"
      v-model="nickname"
      class="form-input"
      type="text"
      autocomplete="off"
      :aria-invalid="error !== null"
      :aria-describedby="error ? errorId : undefined"
    />
    <p v-if="error" :id="errorId" class="form-error" role="alert">{{ error }}</p>
    <div class="nickname-form__actions">
      <button type="submit" class="button-primary" :disabled="!canSubmit" :aria-busy="submitting">
        {{ submitting ? 'Working…' : submitLabel }}
      </button>
      <button
        v-if="cancellable"
        type="button"
        class="nickname-form__cancel"
        :disabled="submitting"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<style scoped>
.nickname-form {
  display: grid;
  gap: var(--space-2);
}

.nickname-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.nickname-form__cancel {
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 0;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.nickname-form__cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
