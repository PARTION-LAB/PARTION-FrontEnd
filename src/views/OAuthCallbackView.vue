<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithOAuthCode } from '../api/auth'
import { useAuth } from '../composables/useAuth'
import { normalizeAuthRedirect } from '../utils/authRedirect'

const OAUTH_PROVIDERS = {
  google: {
    label: 'Google',
    stateKey: 'partionGoogleOAuthState',
    redirectKey: 'partionGoogleOAuthRedirect',
  },
  kakao: {
    label: 'Kakao',
    stateKey: 'partionKakaoOAuthState',
    redirectKey: 'partionKakaoOAuthRedirect',
  },
  naver: {
    label: 'Naver',
    stateKey: 'partionNaverOAuthState',
    redirectKey: 'partionNaverOAuthRedirect',
  },
}

const route = useRoute()
const router = useRouter()
const { setSession } = useAuth()

const message = ref('OAuth 로그인 처리 중입니다.')
const messageType = ref('info')
const isProcessing = ref(true)

function getProvider() {
  const provider = route.params.provider
  return typeof provider === 'string' ? provider.toLowerCase() : ''
}

function setFailure(nextMessage) {
  message.value = nextMessage
  messageType.value = 'error'
  isProcessing.value = false
}

function clearOAuthStorage(providerConfig) {
  localStorage.removeItem(providerConfig.stateKey)
  localStorage.removeItem(providerConfig.redirectKey)
}

function getOAuthRedirectTarget(providerConfig) {
  const redirect = normalizeAuthRedirect(localStorage.getItem(providerConfig.redirectKey))
  return redirect ? { path: redirect } : { name: 'products' }
}

async function completeOAuthLogin() {
  const provider = getProvider()
  const providerConfig = OAUTH_PROVIDERS[provider]

  if (!providerConfig) {
    setFailure('지원하지 않는 OAuth 로그인입니다.')
    return
  }

  message.value = `${providerConfig.label} 로그인 처리 중입니다.`

  const error = route.query.error
  const errorDescription = route.query.error_description
  const code = route.query.code
  const state = route.query.state
  const storedState = localStorage.getItem(providerConfig.stateKey)

  if (error) {
    clearOAuthStorage(providerConfig)
    setFailure(
      typeof errorDescription === 'string'
        ? errorDescription
        : `${providerConfig.label} 로그인이 취소되었습니다.`,
    )
    return
  }

  if (typeof code !== 'string' || typeof state !== 'string') {
    setFailure(`${providerConfig.label} 로그인 응답을 확인하지 못했습니다.`)
    return
  }

  if (!storedState || storedState !== state) {
    clearOAuthStorage(providerConfig)
    setFailure(`${providerConfig.label} 로그인 요청 정보가 일치하지 않습니다.`)
    return
  }

  try {
    const data = await loginWithOAuthCode({ provider, code, state })
    setSession(data)
    const redirectTarget = getOAuthRedirectTarget(providerConfig)
    clearOAuthStorage(providerConfig)
    message.value = `${providerConfig.label} 로그인이 완료되었습니다.`
    messageType.value = 'success'
    await router.replace(redirectTarget)
  } catch (nextError) {
    clearOAuthStorage(providerConfig)
    setFailure(nextError.message || `${providerConfig.label} 로그인에 실패했습니다.`)
  }
}

onMounted(() => {
  completeOAuthLogin()
})
</script>

<template>
  <main class="auth-page">
    <section class="auth-card oauth-callback-card">
      <button class="auth-brand" type="button" @click="router.push({ name: 'products' })">
        Partion
      </button>
      <p class="eyebrow">OAuth</p>
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
