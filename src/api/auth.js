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

  return data
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
