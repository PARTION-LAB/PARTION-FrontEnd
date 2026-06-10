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

export function normalizeOrder(order) {
  if (!order) {
    return null
  }

  const orderId = order.orderId ?? order.id
  const type = order.type || order.side || 'BUY'
  const orderMethod = order.orderMethod || order.orderType || 'LIMIT'
  const quantity = Number(order.quantity ?? 0)
  const remainingQuantity = Number(
    order.remainingQuantity ?? Math.max(0, quantity - Number(order.filledQuantity ?? 0)),
  )
  const filledQuantity = Number(
    order.filledQuantity ?? Math.max(0, quantity - remainingQuantity),
  )
  const status = order.status === 'CANCELLED' ? 'CANCELED' : order.status

  return {
    ...order,
    id: orderId,
    orderId,
    productId: order.productId,
    productName: order.productName,
    type,
    side: type,
    orderMethod,
    orderType: orderMethod,
    price: Number(order.price ?? 0),
    quantity,
    remainingQuantity,
    filledQuantity,
    status,
    createdTrades: Array.isArray(order.createdTrades) ? order.createdTrades : [],
  }
}

export async function getTradingProducts({ category, keyword, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/trading/products', { category, keyword, page, size })),
    '거래 가능 상품 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeProduct).filter(Boolean),
  }
}

export async function createOrder({ productId, type, orderMethod, price, quantity }) {
  return normalizeOrder(
    await handleResponse(
      await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          type,
          orderMethod,
          price,
          quantity,
        }),
      }, { auth: true }),
      '주문을 생성하지 못했습니다.',
    ),
  )
}

export async function getMyOrders({ productId, type, status, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/orders/me', {
      productId,
      type,
      status,
      page,
      size,
    }), {}, { auth: true }),
    '내 주문 내역을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeOrder).filter(Boolean),
  }
}

export async function cancelOrder(orderId) {
  return normalizeOrder(
    await handleResponse(
      await request(`/api/orders/${orderId}`, { method: 'DELETE' }, { auth: true }),
      '주문을 취소하지 못했습니다.',
    ),
  )
}
