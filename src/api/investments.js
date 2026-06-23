import { reissueAccessToken } from './auth'
import { normalizeProduct } from './products'

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

export function normalizeInvestment(investment) {
  if (!investment) {
    return null
  }

  const investmentId = investment.investmentId ?? investment.id
  const totalAmount = investment.totalAmount ?? investment.amount ?? 0
  const requestedQuantity = Number(investment.requestedQuantity ?? investment.quantity ?? 0)
  const investedQuantity = Number(investment.investedQuantity ?? investment.quantity ?? 0)
  const unfilledQuantity = Number(
    investment.unfilledQuantity ?? Math.max(0, requestedQuantity - investedQuantity),
  )
  const leftoverAmount = Number(
    investment.leftoverAmount ??
    investment.uninvestedAmount ??
    Number(investment.pricePerToken ?? investment.unitPrice ?? 0) * unfilledQuantity,
  )

  return {
    ...investment,
    id: investmentId,
    investmentId,
    productId: investment.productId,
    productName: investment.productName,
    quantity: investment.quantity ?? investedQuantity,
    requestedQuantity,
    investedQuantity,
    unfilledQuantity,
    leftoverAmount,
    partialFilled: Boolean(investment.partialFilled ?? unfilledQuantity > 0),
    pricePerToken: investment.pricePerToken ?? investment.unitPrice ?? 0,
    totalAmount,
    amount: totalAmount,
    createdAt: investment.createdAt || investment.investedAt,
  }
}

export async function getInvestmentProducts({ category, keyword, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/investments/products', { category, keyword, page, size })),
    '모집 중 상품 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeProduct),
  }
}

export async function getInvestmentProduct(productId) {
  return normalizeProduct(
    await handleResponse(
      await request(`/api/investments/products/${productId}`),
      '모집 상품 상세 정보를 불러오지 못했습니다.',
    ),
  )
}

export async function createInvestment({ productId, quantity }) {
  return normalizeInvestment(
    await handleResponse(
      await request('/api/investments', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }, { auth: true }),
      '상품 투자를 처리하지 못했습니다.',
    ),
  )
}

export async function getMyInvestments({ productId, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/investments/me', { productId, page, size }), {}, { auth: true }),
    '내 투자 내역을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeInvestment),
  }
}
