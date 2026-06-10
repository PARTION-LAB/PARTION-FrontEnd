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

async function request(path, options = {}, { auth = false } = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: auth ? getHeaders() : { 'Content-Type': 'application/json' },
  })

  if (!auth || response.status !== 401) {
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

async function handleResponse(response, fallback) {
  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, fallback)
  }

  return getResponseData(data)
}

export async function getTossClientConfig() {
  return handleResponse(await request('/api/config'), '결제 설정을 불러오지 못했습니다.')
}

export async function savePaymentAmount(payload) {
  return handleResponse(
    await request('/api/payments/save-amount', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { auth: true }),
    '결제 정보를 저장하지 못했습니다.',
  )
}

export async function verifyPaymentAmount(payload) {
  return handleResponse(
    await request('/api/payments/verify-amount', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { auth: true }),
    '결제 금액을 확인하지 못했습니다.',
  )
}

export async function confirmPayment(payload) {
  return handleResponse(
    await request('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { auth: true }),
    '결제를 승인하지 못했습니다.',
  )
}
