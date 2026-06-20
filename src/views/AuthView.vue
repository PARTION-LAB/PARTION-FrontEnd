<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  loginUser,
  registerUser,
  sendEmailVerificationCode,
  verifyEmailCode,
} from '../api/auth'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['navigate'])
const route = useRoute()
const { setSession } = useAuth()

const authMode = ref('login')
const nickname = ref('')
const email = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationSentTo = ref('')
const isEmailVerified = ref(false)
const isSubmitting = ref(false)
const isSendingVerification = ref(false)
const isVerifyingCode = ref(false)
const authMessage = ref('')
const authMessageType = ref('info')

const isLogin = computed(() => authMode.value === 'login')
const title = computed(() => (isLogin.value ? '로그인하고 투자를 이어가세요' : '회원가입하고 투자를 시작하세요'))
const submitLabel = computed(() => (isLogin.value ? '로그인' : '회원가입'))
const trimmedEmail = computed(() => email.value.trim())
const canVerifyCode = computed(() => {
  return Boolean(verificationSentTo.value)
    && verificationSentTo.value === trimmedEmail.value
    && verificationCode.value.trim().length === 6
})

function setAuthMode(mode) {
  authMode.value = mode
  authMessage.value = ''
  if (mode === 'login') {
    resetEmailVerification()
  }
}

watch(
  () => route.name,
  (routeName) => {
    authMode.value = routeName === 'signup' ? 'signup' : 'login'
    authMessage.value = ''
  },
  { immediate: true },
)

watch(trimmedEmail, (nextEmail) => {
  if (isEmailVerified.value && nextEmail !== verificationSentTo.value) {
    isEmailVerified.value = false
  }

  if (verificationSentTo.value && nextEmail !== verificationSentTo.value) {
    verificationCode.value = ''
  }
})

function setMessage(message, type = 'info') {
  authMessage.value = message
  authMessageType.value = type
}

function resetEmailVerification() {
  verificationCode.value = ''
  verificationSentTo.value = ''
  isEmailVerified.value = false
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateSignupForm() {
  const trimmedNickname = nickname.value.trim()

  if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
    return '닉네임은 2자 이상 10자 이하로 입력해주세요.'
  }

  if (!isValidEmail(trimmedEmail.value)) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (!isEmailVerified.value || verificationSentTo.value !== trimmedEmail.value) {
    return '이메일 인증번호 확인을 완료해주세요.'
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(password.value)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 20자 이하로 입력해주세요.'
  }

  return ''
}

function validateLoginForm() {
  if (!isValidEmail(trimmedEmail.value)) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (!password.value) {
    return '비밀번호를 입력해주세요.'
  }

  return ''
}

async function handleSendVerification() {
  if (!isValidEmail(trimmedEmail.value)) {
    setMessage('올바른 이메일 형식으로 입력해주세요.', 'error')
    return
  }

  isSendingVerification.value = true
  setMessage('')

  try {
    const data = await sendEmailVerificationCode({
      email: trimmedEmail.value,
      purpose: 'SIGNUP',
    })
    const debugCode = data?.debugCode ?? data?.response?.debugCode

    verificationSentTo.value = trimmedEmail.value
    verificationCode.value = debugCode || ''
    isEmailVerified.value = false
    setMessage(
      debugCode
        ? `메일 서버가 연결되지 않아 테스트 인증번호 ${debugCode}을 사용합니다.`
        : '인증번호를 발송했습니다. 메일함을 확인해주세요.',
      'success',
    )
  } catch (error) {
    setMessage(error.message || '인증번호 발송에 실패했습니다.', 'error')
  } finally {
    isSendingVerification.value = false
  }
}

async function handleVerifyCode() {
  const code = verificationCode.value.trim()

  if (!verificationSentTo.value) {
    setMessage('먼저 인증번호를 발송해주세요.', 'error')
    return
  }

  if (verificationSentTo.value !== trimmedEmail.value) {
    setMessage('이메일이 변경되었습니다. 인증번호를 다시 발송해주세요.', 'error')
    return
  }

  if (!/^\d{6}$/.test(code)) {
    setMessage('인증번호 6자리를 입력해주세요.', 'error')
    return
  }

  isVerifyingCode.value = true
  setMessage('')

  try {
    const data = await verifyEmailCode({
      email: trimmedEmail.value,
      purpose: 'SIGNUP',
      code,
    })
    const verified = data?.verified ?? data?.response?.verified

    if (verified === false) {
      throw new Error('인증번호가 일치하지 않습니다.')
    }

    isEmailVerified.value = true
    setMessage('이메일 인증이 완료되었습니다.', 'success')
  } catch (error) {
    isEmailVerified.value = false
    setMessage(error.message || '인증번호 확인에 실패했습니다.', 'error')
  } finally {
    isVerifyingCode.value = false
  }
}

async function handleSubmit() {
  if (isLogin.value) {
    const validationMessage = validateLoginForm()

    if (validationMessage) {
      setMessage(validationMessage, 'error')
      return
    }

    isSubmitting.value = true
    setMessage('')

    try {
      const data = await loginUser({
        email: trimmedEmail.value,
        password: password.value,
      })

      setSession(data)
      setMessage('로그인되었습니다.', 'success')
      password.value = ''
      emit('navigate', 'products')
    } catch (error) {
      setMessage(error.message || '로그인에 실패했습니다.', 'error')
    } finally {
      isSubmitting.value = false
    }

    return
  }

  const validationMessage = validateSignupForm()

  if (validationMessage) {
    setMessage(validationMessage, 'error')
    return
  }

  isSubmitting.value = true
  setMessage('')

  try {
    await registerUser({
      nickname: nickname.value.trim(),
      email: trimmedEmail.value,
      password: password.value,
    })

    setMessage('회원가입이 완료되었습니다. 로그인해 주세요.', 'success')
    authMode.value = 'login'
    nickname.value = ''
    password.value = ''
    resetEmailVerification()
  } catch (error) {
    setMessage(error.message || '회원가입에 실패했습니다.', 'error')
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
      <p class="eyebrow">회원 인증</p>
      <h1>{{ title }}</h1>

      <div class="auth-tabs">
        <button
          type="button"
          :class="{ selected: isLogin }"
          :aria-pressed="isLogin"
          @click="setAuthMode('login')"
        >
          로그인
        </button>
        <button
          type="button"
          :class="{ selected: !isLogin }"
          :aria-pressed="!isLogin"
          @click="setAuthMode('signup')"
        >
          회원가입
        </button>
      </div>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <label v-if="!isLogin">
          <span>닉네임</span>
          <input
            v-model="nickname"
            type="text"
            autocomplete="nickname"
            minlength="2"
            maxlength="10"
            required
          />
        </label>
        <label>
          <span>이메일</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <div v-if="!isLogin" class="verification-panel">
          <div class="verification-actions">
            <button
              type="button"
              class="verification-send-button"
              :disabled="isSendingVerification || isSubmitting"
              @click="handleSendVerification"
            >
              {{ isSendingVerification ? '발송 중...' : verificationSentTo && verificationSentTo === trimmedEmail ? '인증번호 재발송' : '인증번호 발송' }}
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
            <span>인증번호</span>
            <div class="verification-code-row">
              <input
                v-model="verificationCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="6자리 입력"
                :disabled="!verificationSentTo || verificationSentTo !== trimmedEmail || isEmailVerified"
              />
              <button
                type="button"
                class="verification-check-button"
                :disabled="!canVerifyCode || isVerifyingCode || isEmailVerified"
                @click="handleVerifyCode"
              >
                {{ isVerifyingCode ? '확인 중...' : '확인' }}
              </button>
            </div>
          </label>
        </div>
        <label>
          <span>비밀번호</span>
          <input
            v-model="password"
            type="password"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            minlength="8"
            maxlength="20"
            required
          />
        </label>
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '처리 중...' : submitLabel }}
        </button>
        <p
          v-if="authMessage"
          class="auth-message"
          :class="authMessageType"
          role="status"
        >
          {{ authMessage }}
        </p>
      </form>

      <div class="social-login">
        <p>소셜 계정으로 계속하기</p>
        <button type="button"><span class="google">G</span>Google 로그인</button>
        <button type="button"><span class="kakao">K</span>Kakao 로그인</button>
        <button type="button"><span class="naver">N</span>Naver 로그인</button>
      </div>
    </section>
  </main>
</template>
