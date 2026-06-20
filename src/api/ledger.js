const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

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

async function request(path) {
  return fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

async function handleResponse(response, fallback) {
  const data = await parseResponse(response)

  if (!response.ok) {
    throwApiError(response, data, fallback)
  }

  return data?.response || data
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

function normalizePayload(payload) {
  if (!payload) {
    return {}
  }

  if (typeof payload === 'object') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch {
    return {}
  }
}

function normalizeTimestamp(value) {
  if (!value) {
    return null
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString()
  }

  if (/^\d+$/.test(String(value))) {
    return new Date(Number(value)).toISOString()
  }

  return value
}

export function normalizeLedgerTransaction(transaction) {
  if (!transaction) {
    return null
  }

  const payload = normalizePayload(transaction.payload)
  const price = Number(payload.price ?? 0)
  const quantity = Number(payload.quantity ?? 0)

  return {
    ...transaction,
    payload,
    id: transaction.id ?? transaction.transactionHash,
    transactionHash: transaction.transactionHash || '',
    payloadHash: transaction.payloadHash || '',
    eventType: transaction.eventType || payload.eventType || 'LEDGER_EVENT',
    referenceType: transaction.referenceType || payload.referenceType || '',
    referenceId: transaction.referenceId ?? payload.referenceId,
    productName: payload.productName || payload.productSymbol || payload.symbol || '-',
    productCategory: payload.productCategory || payload.category || '기타',
    price,
    quantity,
    amount: Number(payload.amount ?? price * quantity),
    occurredAt: normalizeTimestamp(payload.occurredAt) || normalizeTimestamp(transaction.createdAt),
    createdAt: normalizeTimestamp(transaction.createdAt),
  }
}

export function normalizeLedgerBlock(block) {
  if (!block) {
    return null
  }

  const transactions = Array.isArray(block.transactions)
    ? block.transactions.map(normalizeLedgerTransaction).filter(Boolean)
    : []

  return {
    ...block,
    blockNumber: Number(block.blockNumber ?? block.index ?? 0),
    previousHash: block.previousHash || '',
    merkleRoot: block.merkleRoot || '',
    currentHash: block.currentHash || block.hash || '',
    createdAt: normalizeTimestamp(block.createdAt),
    eventCount: Number(block.eventCount ?? transactions.length),
    transactions,
  }
}

export async function getLedgerBlocks({ page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/ledger/blocks', { page, size })),
    '원장 블록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeLedgerBlock).filter(Boolean),
  }
}

export async function getLedgerTransactions({ page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/ledger/transactions', { page, size })),
    '원장 트랜잭션을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeLedgerTransaction).filter(Boolean),
  }
}

export async function verifyLedger() {
  return handleResponse(await request('/api/ledger/verify'), '원장 무결성 검증에 실패했습니다.')
}
