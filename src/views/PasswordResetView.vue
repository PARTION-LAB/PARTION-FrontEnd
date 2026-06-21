<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { resetPassword, sendEmailVerificationLink } from '../api/auth'

const emit = defineEmits(['navigate'])
const route = useRoute()

const email = ref('')
const newPassword = ref('')
const verificationSentTo = ref('')
const isEmailVerified = ref(false)
const isSendingVerification = ref(false)
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('info')

const trimmedEmail = computed(() => email.value.trim())

function setMessage(nextMessage, type = 'info') {
  message.value = nextMessage
  messageType.value = type
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function resetVerificationState() {
  verificationSentTo.value = ''
  isEmailVerified.value = false
}

watch(
  () => route.query,
  (query) => {
    if (query.emailVerified === 'true' && typeof query.email === 'string') {
      email.value = query.email
      verificationSentTo.value = query.email
      isEmailVerified.value = true
      setMessage('이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.', 'success')
      return
    }

    if (query.emailVerified === 'false') {
      resetVerificationState()
      setMessage(
        query.reason === 'expired'
          ? '인증 링크가 만료되었습니다. 인증 메일을 다시 발송해주세요.'
          : '이메일 인증에 실패했습니다. 인증 메일을 다시 발송해주세요.',
        'error',
      )
    }
  },
  { immediate: true },
)

watch(trimmedEmail, (nextEmail) => {
  if (isEmailVerified.value && nextEmail !== verificationSentTo.value) {
    isEmailVerified.value = false
  }
})

async function handleSendVerification() {
  if (!isValidEmail(trimmedEmail.value)) {
    setMessage('올바른 이메일 형식으로 입력해주세요.', 'error')
    return
  }

  isSendingVerification.value = true
  setMessage('')

  try {
    await sendEmailVerificationLink({
      email: trimmedEmail.value,
      purpose: 'PASSWORD_RESET',
    })
    verificationSentTo.value = trimmedEmail.value
    isEmailVerified.value = false
    setMessage('비밀번호 재설정 인증 메일을 발송했습니다. 메일의 인증 버튼을 눌러주세요.', 'success')
  } catch (error) {
    setMessage(error.message || '인증 메일 발송에 실패했습니다.', 'error')
  } finally {
    isSendingVerification.value = false
  }
}

function validateForm() {
  if (!isValidEmail(trimmedEmail.value)) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (!isEmailVerified.value || verificationSentTo.value !== trimmedEmail.value) {
    return '이메일 인증을 완료해주세요.'
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(newPassword.value)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 20자 이하로 입력해주세요.'
  }

  return ''
}

async function handleSubmit() {
  const validationMessage = validateForm()

  if (validationMessage) {
    setMessage(validationMessage, 'error')
    return
  }

  isSubmitting.value = true
  setMessage('')

  try {
    await resetPassword({
      email: trimmedEmail.value,
      newPassword: newPassword.value,
    })
    newPassword.value = ''
    resetVerificationState()
    setMessage('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.', 'success')
  } catch (error) {
    setMessage(error.message || '비밀번호 재설정에 실패했습니다.', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <button class="auth-brand" type="button" @click="emit('navigate', 'products')">
        Partion
      </button>
      <p class="eyebrow">계정 보안</p>
      <h1>비밀번호를 다시 설정하세요</h1>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <label>
          <span>이메일</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <div class="verification-panel">
          <div class="verification-actions">
            <button
              type="button"
              class="verification-send-button"
              :disabled="isSendingVerification || isSubmitting"
              @click="handleSendVerification"
            >
              {{ isSendingVerification ? '발송 중...' : verificationSentTo && verificationSentTo === trimmedEmail ? '인증 메일 재발송' : '인증 메일 발송' }}
            </button>
            <span
              v-if="isEmailVerified"
              class="verification-status success"
            >
              인증 완료
            </span>
            <span
              v-else-if="verificationSentTo && verificationSentTo === trimmedEmail"
              class="verification-status"
            >
              메일 발송됨
            </span>
          </div>
          <label>
            <span>인증 상태</span>
            <input
              type="text"
              :value="isEmailVerified ? '인증 완료' : verificationSentTo && verificationSentTo === trimmedEmail ? '메일의 인증 버튼을 눌러주세요' : '인증 메일 발송 전'"
              disabled
            />
          </label>
        </div>

        <label>
          <span>새 비밀번호</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="20"
            required
          />
        </label>

        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '재설정 중...' : '비밀번호 재설정' }}
        </button>
        <p
          v-if="message"
          class="auth-message"
          :class="messageType"
          role="status"
        >
          {{ message }}
        </p>
      </form>

      <div class="auth-footer-actions">
        <button type="button" @click="emit('navigate', 'login')">
          로그인으로 돌아가기
        </button>
      </div>
    </section>
  </main>
</template>
