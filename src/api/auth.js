const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
const ACCESS_TOKEN_KEY = 'partionAccessToken'

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(data, fallback) {
  if (!data) {
    return fallback
  }

  if (typeof data === 'string') {
    return data
  }

  if (typeof data.error === 'string') {
    return data.error
  }

  if (typeof data.message === 'string') {
    return data.message
  }

  return fallback
}

function getResponseData(data) {
  return data?.response || data
}

function createMockLoginResponse(email) {
  return {
    success: true,
    response: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 1800,
      member: {
        id: 1,
        email,
        nickname: 'user123',
        role: 'ROLE_USER',
      },
    },
    error: null,
  }
}

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }
  const accessToken = getStoredAccessToken()

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

function throwApiError(response, data, fallback) {
  const error = new Error(getErrorMessage(data, fallback))
  error.status = response.status
  throw error
}

export async function loginUser({ email, password }) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 400)
    })

    if (!email || !password) {
      throw new Error('이메일 또는 비밀번호를 확인해주세요')
    }

    return createMockLoginResponse(email)
  }

  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, '로그인에 실패했습니다.'))
  }

  const loginData = getResponseData(data)

  if (!loginData?.accessToken) {
    throw new Error('로그인 응답에서 인증 토큰을 확인하지 못했습니다.')
  }

  return data
}

function getOAuthProviderLabel(provider) {
  const labels = {
    google: 'Google',
    naver: 'Naver',
    kakao: 'Kakao',
  }

  return labels[provider] || provider
}

export async function getOAuthAuthorizationUrl(provider) {
  const normalizedProvider = provider?.toLowerCase()
  const providerLabel = getOAuthProviderLabel(normalizedProvider)

  if (USE_MOCK_API) {
    const state = `mock-${normalizedProvider}-state-${Date.now()}`

    return {
      authorizationUrl: `/oauth/${normalizedProvider}/callback?code=mock-code&state=${state}`,
      state,
    }
  }

  const response = await fetch(buildApiUrl(`/api/auth/oauth/${normalizedProvider}/authorization-url`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `${providerLabel} 로그인 URL을 가져오지 못했습니다.`))
  }

  return getResponseData(data)
}

export async function loginWithOAuthCode({ provider, code, state }) {
  const normalizedProvider = provider?.toLowerCase()
  const providerLabel = getOAuthProviderLabel(normalizedProvider)

  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })

    if (!code || !state) {
      throw new Error(`${providerLabel} 로그인 응답을 확인하지 못했습니다.`)
    }

    return createMockLoginResponse(`${normalizedProvider}-user@example.com`)
  }

  const response = await fetch(buildApiUrl(`/api/auth/oauth/${normalizedProvider}/login`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      state,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `${providerLabel} 로그인에 실패했습니다.`))
  }

  const loginData = getResponseData(data)

  if (!loginData?.accessToken) {
    throw new Error('로그인 응답에서 인증 토큰을 확인하지 못했습니다.')
  }

  return data
}

export function getGoogleOAuthAuthorizationUrl() {
  return getOAuthAuthorizationUrl('google')
}

export function loginWithGoogleOAuthCode({ code, state }) {
  return loginWithOAuthCode({ provider: 'google', code, state })
}

export function getNaverOAuthAuthorizationUrl() {
  return getOAuthAuthorizationUrl('naver')
}

export function loginWithNaverOAuthCode({ code, state }) {
  return loginWithOAuthCode({ provider: 'naver', code, state })
}

export async function registerUser({ nickname, email, password }) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 400)
    })

    return {
      success: true,
      response: {
        nickname,
        email,
      },
      error: null,
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nickname,
      email,
      password,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, '회원가입에 실패했습니다.'))
  }

  return data
}

export async function sendEmailVerificationLink({ email, purpose = 'SIGNUP' }) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })

    if (!email) {
      throw new Error('이메일을 입력해주세요.')
    }

    return {
      email,
      purpose,
      expiresIn: 300,
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/email/send'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      purpose,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, '인증 메일 발송에 실패했습니다.'))
  }

  return data
}

export const sendEmailVerificationCode = sendEmailVerificationLink

export async function resetPassword({ email, newPassword }) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })

    if (!email || !newPassword) {
      throw new Error('이메일과 새 비밀번호를 입력해주세요.')
    }

    return {
      email,
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/password/reset'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      newPassword,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, '비밀번호 재설정에 실패했습니다.'))
  }

  return data
}

export async function logoutUser() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 200)
    })

    return {
      success: true,
      response: null,
      error: null,
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, '로그아웃에 실패했습니다.')
  }

  return data
}

export async function reissueAccessToken() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 200)
    })

    return {
      success: true,
      response: {
        accessToken: 'mock-access-token-reissued',
        refreshToken: 'mock-refresh-token-reissued',
        tokenType: 'Bearer',
        expiresIn: 1800,
      },
      error: null,
    }
  }

  const response = await fetch(buildApiUrl('/api/auth/reissue'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, '토큰 재발급에 실패했습니다.')
  }

  return data
}
