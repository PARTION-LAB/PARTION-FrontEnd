<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loginUser, registerUser } from '../api/auth'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['navigate'])
const route = useRoute()
const { setSession } = useAuth()

const authMode = ref('login')
const nickname = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const authMessage = ref('')
const authMessageType = ref('info')

const isLogin = computed(() => authMode.value === 'login')
const title = computed(() => (isLogin.value ? '로그인하고 투자를 이어가세요' : '회원가입하고 투자를 시작하세요'))
const submitLabel = computed(() => (isLogin.value ? '로그인' : '회원가입'))

function setAuthMode(mode) {
  authMode.value = mode
  authMessage.value = ''
}

watch(
  () => route.name,
  (routeName) => {
    authMode.value = routeName === 'signup' ? 'signup' : 'login'
    authMessage.value = ''
  },
  { immediate: true },
)

function setMessage(message, type = 'info') {
  authMessage.value = message
  authMessageType.value = type
}

function validateSignupForm() {
  const trimmedNickname = nickname.value.trim()
  const trimmedEmail = email.value.trim()

  if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
    return '닉네임은 2자 이상 10자 이하로 입력해주세요.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(password.value)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 20자 이하로 입력해주세요.'
  }

  return ''
}

function validateLoginForm() {
  const trimmedEmail = email.value.trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (!password.value) {
    return '비밀번호를 입력해주세요.'
  }

  return ''
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
        email: email.value.trim(),
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
      email: email.value.trim(),
      password: password.value,
    })

    setMessage('회원가입이 완료되었습니다. 로그인해 주세요.', 'success')
    authMode.value = 'login'
    nickname.value = ''
    password.value = ''
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
