import { reissueAccessToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
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

export async function sendAiChatMessage({ message }) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 300)
    })

    if (!message?.trim()) {
      throw new Error('질문을 입력해주세요.')
    }

    return {
      answer: 'Partion AI 가이드는 서비스 사용법과 STO 기본 개념을 안내합니다.',
    }
  }

  const response = await requestWithTokenRefresh('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
    }),
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'AI 가이드 답변을 불러오지 못했습니다.'))
  }

  return getResponseData(data)
}
