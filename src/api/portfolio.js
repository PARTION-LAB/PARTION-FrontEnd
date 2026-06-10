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

function appendQuery(path, params = {}) {
  const searchParams = new globalThis.URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
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

function normalizePage(data) {
  const page = data || {}
  const content = Array.isArray(page.content) ? page.content : Array.isArray(page) ? page : []

  return {
    content,
    page: page.page ?? 0,
    size: page.size ?? content.length,
    totalElements: page.totalElements ?? content.length,
    totalPages: page.totalPages ?? 1,
    hasNext: page.hasNext ?? page.last === false,
  }
}

export function normalizePortfolioHolding(holding) {
  if (!holding) {
    return null
  }

  const productId = holding.productId ?? holding.id
  const quantity = Number(holding.quantity ?? 0)
  const reservedQuantity = Number(
    holding.lockedQuantity ?? holding.reservedQuantity ?? holding.locked ?? 0,
  )
  const availableQuantity = Number(
    holding.availableQuantity ?? Math.max(0, quantity - reservedQuantity),
  )

  return {
    ...holding,
    id: productId,
    productId,
    productName: holding.productName || holding.name || holding.title,
    quantity,
    reservedQuantity,
    lockedQuantity: reservedQuantity,
    availableQuantity,
    marketPrice: Number(
      holding.marketPrice ??
      holding.currentPrice ??
      holding.lastTradePrice ??
      holding.tokenPrice ??
      holding.averagePrice ??
      0,
    ),
  }
}

export function normalizePortfolioSummary(summary) {
  if (!summary) {
    return null
  }

  return {
    ...summary,
    totalAssetAmount: Number(summary.totalAssetAmount ?? summary.totalAssets ?? 0),
    cashBalance: Number(summary.cashBalance ?? summary.availableBalance ?? 0),
    lockedCashBalance: Number(summary.lockedCashBalance ?? summary.lockedBalance ?? 0),
    investmentAmount: Number(summary.investmentAmount ?? summary.tokenAssetAmount ?? 0),
    profitLoss: Number(summary.profitLoss ?? 0),
    profitRate: Number(summary.profitRate ?? 0),
  }
}

export async function getPortfolioSummary() {
  return normalizePortfolioSummary(
    await handleResponse(
      await request('/api/portfolio/summary', {}, { auth: true }),
      '포트폴리오 요약을 불러오지 못했습니다.',
    ),
  )
}

export async function getPortfolioHoldings({ page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/portfolio/holdings', { page, size }), {}, { auth: true }),
    '보유 자산 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizePortfolioHolding).filter(Boolean),
  }
}
