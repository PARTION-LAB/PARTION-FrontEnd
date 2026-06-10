import { reissueAccessToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const ACCESS_TOKEN_KEY = 'partionAccessToken'
const REFRESH_TOKEN_KEY = 'partionRefreshToken'

const categoryLabels = {
  REAL_ESTATE: '부동산',
  ART: '미술품',
  MUSIC: '음악저작권',
}

const categoryKeys = {
  REAL_ESTATE: 'real-estate',
  ART: 'art',
  MUSIC: 'music',
}

const statusLabels = {
  FUNDING: '투자자 모집중',
  RECRUITING: '투자자 모집중',
  TRADING: '바로 거래 가능',
  CLOSED: '모집 완료 · 거래 가능',
}

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

function normalizeCategory(category, categoryName) {
  if (categoryLabels[category]) {
    return category
  }

  if (categoryName === '부동산' || category === '부동산' || category === 'real-estate') {
    return 'REAL_ESTATE'
  }

  if (categoryName === '미술품' || category === '미술품' || category === 'art') {
    return 'ART'
  }

  return 'MUSIC'
}

export function normalizeProduct(product) {
  if (!product) {
    return null
  }

  const productId = product.productId ?? product.id
  const category = normalizeCategory(product.category, product.categoryName)
  const status = product.status || (product.open ? 'FUNDING' : 'TRADING')
  const tokenPrice = product.tokenPrice ?? product.unitPrice ?? 0
  const targetAmount = product.targetAmount ?? 0
  const currentAmount = product.currentAmount ?? product.fundedAmount ?? 0
  const open = status === 'FUNDING' || status === 'RECRUITING' || product.open === true

  return {
    ...product,
    id: productId,
    productId,
    symbol: product.symbol || `PRODUCT-${productId}`,
    category: categoryLabels[category],
    categoryCode: category,
    categoryKey: categoryKeys[category],
    name: product.name || product.title,
    summary: product.summary || product.description || '',
    description: product.description || product.summary || '',
    imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad?auto=format&fit=crop&w=1200&q=80',
    status,
    statusLabel: statusLabels[status] || status,
    unitPrice: tokenPrice,
    tokenPrice,
    targetAmount,
    fundedAmount: currentAmount,
    currentAmount,
    expectedYield: typeof product.expectedYield === 'number' ? `연 ${product.expectedYield}%` : product.expectedYield || '-',
    expectedYieldValue: product.expectedYield,
    subscriptionPeriod: product.deadline ? `~ ${product.deadline}` : product.subscriptionPeriod || '-',
    deadline: product.deadline,
    action: open ? '투자하기' : '거래하기',
    open,
  }
}

export async function getProducts({ category, keyword, status, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/products', { category, keyword, status, page, size })),
    '상품 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeProduct),
  }
}

export async function getProduct(productId) {
  return normalizeProduct(
    await handleResponse(
      await request(`/api/products/detail/${productId}`),
      '상품 상세 정보를 불러오지 못했습니다.',
    ),
  )
}

export async function createProduct(payload) {
  return normalizeProduct(
    await handleResponse(
      await request('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, { auth: true }),
      '상품을 등록하지 못했습니다.',
    ),
  )
}

export async function getMyProducts({ status, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/products/me', { status, page, size }), {}, { auth: true }),
    '내가 등록한 상품을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeProduct),
  }
}

export async function requestProductImageUploadUrl({ fileName, contentType }) {
  return handleResponse(
    await request('/api/uploads/products/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }, { auth: true }),
    '이미지 저장 URL을 요청하지 못했습니다.',
  )
}

export async function uploadProductImage(file) {
  const uploadInfo = await requestProductImageUploadUrl({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
  })

  const uploadResponse = await fetch(uploadInfo.presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error('이미지를 업로드하지 못했습니다.')
  }

  return uploadInfo.imageUrl
}
