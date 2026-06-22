<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithOAuthCode } from '../api/auth'
import { useAuth } from '../composables/useAuth'

const OAUTH_PROVIDERS = {
  google: {
    label: 'Google',
    stateKey: 'partionGoogleOAuthState',
  },
  naver: {
    label: 'Naver',
    stateKey: 'partionNaverOAuthState',
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
    localStorage.removeItem(providerConfig.stateKey)
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
    localStorage.removeItem(providerConfig.stateKey)
    setFailure(`${providerConfig.label} 로그인 요청 정보가 일치하지 않습니다.`)
    return
  }

  try {
    const data = await loginWithOAuthCode({ provider, code, state })
    setSession(data)
    localStorage.removeItem(providerConfig.stateKey)
    message.value = `${providerConfig.label} 로그인이 완료되었습니다.`
    messageType.value = 'success'
    await router.replace({ name: 'products' })
  } catch (nextError) {
    localStorage.removeItem(providerConfig.stateKey)
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
