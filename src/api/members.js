import { reissueAccessToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const ACCESS_TOKEN_KEY = 'partionAccessToken'
const REFRESH_TOKEN_KEY = 'partionRefreshToken'

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function saveReissuedTokens(data) {
  const response = data?.response || data || {}

  if (!response.accessToken) {
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)

  if (response.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
  }
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
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

function getResponseData(data) {
  return data?.response || data
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

function throwApiError(response, data, fallback) {
  const error = new Error(getErrorMessage(data, fallback))
  error.status = response.status
  throw error
}

async function requestWithTokenRefresh(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: getHeaders(),
  })

  if (response.status !== 401) {
    return response
  }

  try {
    saveReissuedTokens(await reissueAccessToken())
  } catch {
    return response
  }

  return fetch(buildApiUrl(path), {
    ...options,
    headers: getHeaders(),
  })
}

export async function getMyProfile() {
  const response = await requestWithTokenRefresh('/api/members/me')
  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, '내 정보를 불러오지 못했습니다.')
  }

  return getResponseData(data)
}

export async function updateMyProfile({ nickname }) {
  const response = await requestWithTokenRefresh('/api/members/me', {
    method: 'PATCH',
    body: JSON.stringify({
      nickname,
    }),
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, '내 정보를 저장하지 못했습니다.')
  }

  return getResponseData(data)
}

export async function updateMyPassword({ currentPassword, newPassword }) {
  const response = await requestWithTokenRefresh('/api/members/me/password', {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, '비밀번호를 변경하지 못했습니다.')
  }

  return getResponseData(data)
}
