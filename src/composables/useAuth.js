import { computed, ref } from 'vue'

const ACCESS_TOKEN_KEY = 'partionAccessToken'
const REFRESH_TOKEN_KEY = 'partionRefreshToken'
const MEMBER_KEY = 'partionMember'

function parseStoredMember() {
  const storedMember = localStorage.getItem(MEMBER_KEY)

  if (!storedMember) {
    return null
  }

  try {
    return JSON.parse(storedMember)
  } catch {
    localStorage.removeItem(MEMBER_KEY)
    return null
  }
}

function readSession() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    member: parseStoredMember(),
  }
}

const session = ref(readSession())

function unwrapAuthResponse(data) {
  return data?.response || data || {}
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(session.value.accessToken))
  const user = computed(() => session.value.member)

  function setSession(data) {
    const response = unwrapAuthResponse(data)

    if (!response.accessToken) {
      throw new Error('로그인 응답에서 인증 토큰을 확인하지 못했습니다.')
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)

    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    }

    if (response.member) {
      localStorage.setItem(MEMBER_KEY, JSON.stringify(response.member))
    }

    session.value = readSession()
  }

  function updateTokens(data) {
    const response = unwrapAuthResponse(data)

    if (!response.accessToken) {
      return
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)

    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    }

    session.value = readSession()
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(MEMBER_KEY)
    session.value = readSession()
  }

  function setMember(member) {
    if (!member) {
      return
    }

    localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
    session.value = {
      ...session.value,
      member,
    }
  }

  return {
    clearSession,
    isAuthenticated,
    setMember,
    setSession,
    updateTokens,
    user,
  }
}
