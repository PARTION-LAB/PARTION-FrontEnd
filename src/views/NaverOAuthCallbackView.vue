<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithNaverOAuthCode } from '../api/auth'
import { useAuth } from '../composables/useAuth'

const NAVER_OAUTH_STATE_KEY = 'partionNaverOAuthState'

const route = useRoute()
const router = useRouter()
const { setSession } = useAuth()

const message = ref('Naver 로그인 처리 중입니다.')
const messageType = ref('info')
const isProcessing = ref(true)

function setFailure(nextMessage) {
  message.value = nextMessage
  messageType.value = 'error'
  isProcessing.value = false
}

async function completeNaverLogin() {
  const error = route.query.error
  const errorDescription = route.query.error_description
  const code = route.query.code
  const state = route.query.state
  const storedState = localStorage.getItem(NAVER_OAUTH_STATE_KEY)

  if (error) {
    localStorage.removeItem(NAVER_OAUTH_STATE_KEY)
    setFailure(typeof errorDescription === 'string' ? errorDescription : 'Naver 로그인이 취소되었습니다.')
    return
  }

  if (typeof code !== 'string' || typeof state !== 'string') {
    setFailure('Naver 로그인 응답을 확인하지 못했습니다.')
    return
  }

  if (!storedState || storedState !== state) {
    localStorage.removeItem(NAVER_OAUTH_STATE_KEY)
    setFailure('Naver 로그인 요청 정보가 일치하지 않습니다.')
    return
  }

  try {
    const data = await loginWithNaverOAuthCode({ code, state })
    setSession(data)
    localStorage.removeItem(NAVER_OAUTH_STATE_KEY)
    message.value = 'Naver 로그인이 완료되었습니다.'
    messageType.value = 'success'
    await router.replace({ name: 'products' })
  } catch (nextError) {
    localStorage.removeItem(NAVER_OAUTH_STATE_KEY)
    setFailure(nextError.message || 'Naver 로그인에 실패했습니다.')
  }
}

onMounted(() => {
  completeNaverLogin()
})
</script>

<template>
  <main class="auth-page">
    <section class="auth-card oauth-callback-card">
      <button class="auth-brand" type="button" @click="router.push({ name: 'products' })">
        Partion
      </button>
      <p class="eyebrow">Naver OAuth</p>
      <h1>로그인 처리</h1>
      <p class="auth-message" :class="messageType" role="status">
        {{ message }}
      </p>
      <button v-if="!isProcessing" type="button" @click="router.push({ name: 'login' })">
        로그인 화면으로
      </button>
    </section>
  </main>
</template>
