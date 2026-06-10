import { createServer } from 'node:http'
import { products as sourceProducts } from '../src/data/products.js'

const PORT = Number.parseInt(process.env.MOCK_API_PORT || '8080', 10)

const users = new Map([
  [
    'user123@example.com',
    {
      id: 1,
      nickname: 'user123',
      email: 'user123@example.com',
      password: 'securePassword123!',
      role: 'ROLE_USER',
      createdAt: '2026-06-01T09:00:00.000Z',
    },
  ],
])

const products = sourceProducts.map((product, index) => {
  const id = index + 1
  const category = product.categoryKey.toUpperCase().replace('-', '_')

  return {
    id,
    productId: id,
    symbol: product.symbol,
    name: product.name,
    title: product.name,
    category,
    categoryKey: product.categoryKey,
    categoryName: product.category,
    summary: product.summary,
    description: `${product.summary} 로컬 mock 상세 설명입니다.`,
    imageUrl: product.imageUrl,
    status: product.open ? 'RECRUITING' : 'TRADING',
    unitPrice: product.unitPrice,
    tokenPrice: product.unitPrice,
    targetAmount: product.targetAmount,
    currentAmount: product.fundedAmount,
    fundedAmount: product.fundedAmount,
    fundingRate: Number(((product.fundedAmount / product.targetAmount) * 100).toFixed(1)),
    expectedYield: product.expectedYield,
    subscriptionPeriod: product.subscriptionPeriod,
    open: product.open,
    totalTokens: Math.floor(product.targetAmount / product.unitPrice),
    remainingTokens: Math.max(0, Math.floor((product.targetAmount - product.fundedAmount) / product.unitPrice)),
    issuerId: 1,
    issuerNickname: 'user123',
    createdAt: `2026-06-${String(Math.min(id, 28)).padStart(2, '0')}T09:00:00.000Z`,
  }
})

let nextUserId = users.size + 1
let nextProductId = products.length + 1
let nextInvestmentId = 3
let nextOrderId = 3
let nextBoardId = 3
let nextCommentId = 3
let nextPaymentId = 2
let nextBlockId = 4
const invalidatedRefreshTokens = new Set()

const investments = [
  {
    id: 1,
    productId: 2,
    productName: products[1]?.name,
    amount: 500000,
    quantity: 50,
    status: 'COMPLETED',
    investedAt: '2026-06-03T10:30:00.000Z',
  },
  {
    id: 2,
    productId: 4,
    productName: products[3]?.name,
    amount: 250000,
    quantity: 10,
    status: 'COMPLETED',
    investedAt: '2026-06-05T14:10:00.000Z',
  },
]

const orders = [
  {
    id: 1,
    productId: 7,
    productName: products[6]?.name,
    side: 'BUY',
    orderType: 'LIMIT',
    price: 10100,
    quantity: 12,
    filledQuantity: 4,
    remainingQuantity: 8,
    status: 'OPEN',
    createdAt: '2026-06-07T11:20:00.000Z',
  },
  {
    id: 2,
    productId: 8,
    productName: products[7]?.name,
    side: 'SELL',
    orderType: 'LIMIT',
    price: 8200,
    quantity: 5,
    filledQuantity: 5,
    remainingQuantity: 0,
    status: 'FILLED',
    createdAt: '2026-06-07T12:10:00.000Z',
  },
]

const trades = [
  {
    id: 1,
    productId: 7,
    productName: products[6]?.name,
    side: 'BUY',
    price: 10100,
    quantity: 4,
    tradedAt: '2026-06-07T11:21:00.000Z',
  },
  {
    id: 2,
    productId: 8,
    productName: products[7]?.name,
    side: 'SELL',
    price: 8200,
    quantity: 5,
    tradedAt: '2026-06-07T12:11:00.000Z',
  },
]

const boards = [
  {
    id: 1,
    category: 'QUESTION',
    title: 'STO 투자 질문입니다',
    content: '상품 거래 방식이 궁금합니다.',
    writerId: 1,
    writerNickname: '투자왕',
    createdAt: '2026-06-06T09:00:00.000Z',
    updatedAt: '2026-06-06T09:00:00.000Z',
    viewCount: 35,
  },
  {
    id: 2,
    category: 'FREE',
    title: '로컬 mock 게시판 테스트',
    content: '댓글과 수정/삭제 테스트용 게시글입니다.',
    writerId: 1,
    writerNickname: 'user123',
    createdAt: '2026-06-07T10:00:00.000Z',
    updatedAt: '2026-06-07T10:00:00.000Z',
    viewCount: 12,
  },
]

const comments = [
  {
    id: 1,
    boardId: 1,
    content: '지정가와 시장가 주문을 사용할 수 있습니다.',
    writerId: 1,
    writerNickname: '운영팀',
    createdAt: '2026-06-06T09:30:00.000Z',
  },
  {
    id: 2,
    boardId: 2,
    content: 'mock 댓글입니다.',
    writerId: 1,
    writerNickname: 'user123',
    createdAt: '2026-06-07T10:30:00.000Z',
  },
]

const wallet = {
  memberId: 1,
  balance: 3500000,
  availableBalance: 3200000,
  lockedBalance: 300000,
  currency: 'KRW',
  updatedAt: '2026-06-08T10:00:00.000Z',
}

const walletTransactions = [
  {
    id: 1,
    type: 'DEPOSIT',
    amount: 2000000,
    balanceAfter: 3500000,
    description: 'Toss 충전',
    createdAt: '2026-06-05T08:20:00.000Z',
  },
  {
    id: 2,
    type: 'INVESTMENT',
    amount: -500000,
    balanceAfter: 3000000,
    description: '상품 투자',
    createdAt: '2026-06-05T10:30:00.000Z',
  },
]

const payments = [
  {
    id: 1,
    paymentKey: 'mock-payment-key-1',
    orderId: 'deposit-1',
    amount: 2000000,
    status: 'DONE',
    method: 'TOSS',
    requestedAt: '2026-06-05T08:10:00.000Z',
    approvedAt: '2026-06-05T08:20:00.000Z',
  },
]

const ledgerBlocks = [
  {
    id: 1,
    blockHash: '0xmock0001',
    previousHash: '0xgenesis',
    eventType: 'DEPOSIT',
    payload: { amount: 2000000 },
    createdAt: '2026-06-05T08:20:00.000Z',
  },
  {
    id: 2,
    blockHash: '0xmock0002',
    previousHash: '0xmock0001',
    eventType: 'INVESTMENT',
    payload: { productId: 2, amount: 500000 },
    createdAt: '2026-06-05T10:30:00.000Z',
  },
  {
    id: 3,
    blockHash: '0xmock0003',
    previousHash: '0xmock0002',
    eventType: 'TRADE',
    payload: { productId: 7, price: 10100, quantity: 4 },
    createdAt: '2026-06-07T11:21:00.000Z',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(statusCode === 204 ? '' : JSON.stringify(body))
}

function sendEmpty(response, statusCode = 204) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  response.end('')
}

function ok(response, data = null, statusCode = 200) {
  sendJson(response, statusCode, {
    success: true,
    response: data,
    error: null,
  })
}

function fail(response, statusCode, message) {
  sendJson(response, statusCode, {
    success: false,
    response: null,
    error: message,
  })
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = ''

    request.on('data', (chunk) => {
      rawBody += chunk
    })

    request.on('end', () => {
      if (!rawBody) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(rawBody))
      } catch {
        reject(new Error('요청 본문이 올바른 JSON 형식이 아닙니다.'))
      }
    })
  })
}

async function readBody(request, response) {
  try {
    return await parseJsonBody(request)
  } catch (error) {
    fail(response, 400, error.message)
    return null
  }
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function paginate(items, url) {
  const page = Math.max(0, toInt(url.searchParams.get('page'), 0))
  const size = Math.max(1, toInt(url.searchParams.get('size'), 20))
  const start = page * size
  const content = items.slice(start, start + size)

  return {
    content,
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    last: start + size >= items.length,
  }
}

function findProduct(id) {
  return products.find((product) => product.id === Number(id) || product.productId === Number(id))
}

function createToken(user) {
  return `mock-access-token-${user.id}`
}

function createRefreshToken(user) {
  return `mock-refresh-token-${user.id}`
}

function findUserById(id) {
  return [...users.values()].find((user) => user.id === Number(id))
}

function findUserByRefreshToken(refreshToken) {
  if (refreshToken === 'mock-refresh-token' || refreshToken === 'mock-oauth-refresh-token') {
    return users.values().next().value
  }

  const userId = String(refreshToken || '').match(/^mock-refresh-token-(\d+)$/)?.[1]

  if (!userId) {
    return null
  }

  return findUserById(userId)
}

function getAuthenticatedUser(request) {
  const authorization = request.headers.authorization || ''
  const token = authorization.replace(/^Bearer\s+/i, '')

  if (!token) {
    return null
  }

  if (token === 'mock-access-token' || token === 'mock-oauth-access-token') {
    return users.values().next().value
  }

  const userId = token.match(/^mock-access-token-(\d+)$/)?.[1]

  if (!userId) {
    return null
  }

  return findUserById(userId)
}

function publicUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    provider: user.provider || 'LOCAL',
    role: user.role,
    createdAt: user.createdAt,
  }
}

function validateRegisterRequest({ nickname, email, password }) {
  if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 10) {
    return '닉네임은 2자 이상 10자 이하로 입력해주세요.'
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (typeof password !== 'string' || !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(password)) {
    return '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 20자 이하로 입력해주세요.'
  }

  return ''
}

function categoryNameFromCode(category) {
  if (category === 'REAL_ESTATE') return '부동산'
  if (category === 'ART') return '미술품'
  return '음악저작권'
}

function addLedgerBlock(eventType, payload) {
  const previousHash = ledgerBlocks.at(-1)?.blockHash || '0xgenesis'
  const block = {
    id: nextBlockId,
    blockHash: `0xmock${String(nextBlockId).padStart(4, '0')}`,
    previousHash,
    eventType,
    payload,
    createdAt: nowIso(),
  }
  nextBlockId += 1
  ledgerBlocks.push(block)
  return block
}

async function handleAuth(request, response, url) {
  const { pathname } = url

  if (request.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readBody(request, response)
    if (!body) return

    const validationMessage = validateRegisterRequest(body)

    if (validationMessage) {
      fail(response, 400, validationMessage)
      return
    }

    const nickname = body.nickname.trim()
    const email = body.email.trim()

    if (users.has(email)) {
      fail(response, 409, '이미 존재하는 이메일입니다')
      return
    }

    const user = {
      id: nextUserId,
      nickname,
      email,
      password: body.password,
      role: 'ROLE_USER',
      createdAt: nowIso(),
    }
    nextUserId += 1
    users.set(email, user)

    ok(response, publicUser(user), 201)
    return
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(request, response)
    if (!body) return

    const user = users.get(body.email)

    if (!user || user.password !== body.password) {
      fail(response, 400, '이메일 또는 비밀번호를 확인해주세요')
      return
    }

    ok(response, {
      accessToken: createToken(user),
      refreshToken: createRefreshToken(user),
      tokenType: 'Bearer',
      expiresIn: 1800,
      member: publicUser(user),
    })
    return
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const body = await readBody(request, response)
    if (!body) return

    if (body.refreshToken) {
      invalidatedRefreshTokens.add(body.refreshToken)
    }

    ok(response, null)
    return
  }

  if (request.method === 'POST' && pathname === '/api/auth/reissue') {
    const body = await readBody(request, response)
    if (!body) return

    const { refreshToken } = body
    const user = findUserByRefreshToken(refreshToken)

    if (!refreshToken || invalidatedRefreshTokens.has(refreshToken) || !user) {
      fail(response, 401, 'refresh token이 유효하지 않습니다')
      return
    }

    ok(response, {
      accessToken: createToken(user),
      refreshToken: createRefreshToken(user),
      tokenType: 'Bearer',
      expiresIn: 1800,
    })
    return
  }

  if (request.method === 'GET' && /^\/api\/auth\/oauth2\/[^/]+$/.test(pathname)) {
    const provider = pathname.split('/').at(-1)
    ok(response, {
      provider,
      redirectUrl: `http://localhost:${PORT}/api/auth/oauth2/${provider}/callback?code=mock-code`,
    })
    return
  }

  if (request.method === 'GET' && /^\/api\/auth\/oauth2\/[^/]+\/callback$/.test(pathname)) {
    ok(response, {
      accessToken: 'mock-oauth-access-token',
      refreshToken: 'mock-oauth-refresh-token',
      member: publicUser(users.values().next().value),
    })
    return
  }
}

async function handleMembers(request, response, url) {
  const { pathname } = url
  const user = getAuthenticatedUser(request)

  if (!user && pathname.startsWith('/api/members/me')) {
    fail(response, 401, '로그인이 필요합니다')
    return
  }

  if (request.method === 'GET' && pathname === '/api/members/me') {
    ok(response, publicUser(user))
    return
  }

  if ((request.method === 'PATCH' || request.method === 'PUT') && pathname === '/api/members/me') {
    const body = await readBody(request, response)
    if (!body) return

    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''

    if (nickname.length < 2 || nickname.length > 10) {
      fail(response, 400, '입력값을 확인해주세요')
      return
    }

    const hasDuplicateNickname = [...users.values()].some((item) => item.id !== user.id && item.nickname === nickname)

    if (hasDuplicateNickname) {
      fail(response, 409, '이미 사용 중인 닉네임입니다')
      return
    }

    user.nickname = nickname
    ok(response, publicUser(user))
    return
  }

  if (request.method === 'PATCH' && pathname === '/api/members/me/password') {
    const body = await readBody(request, response)
    if (!body) return

    if (typeof body.newPassword !== 'string' || !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/.test(body.newPassword)) {
      fail(response, 400, '입력값을 확인해주세요')
      return
    }

    if (body.currentPassword !== user.password) {
      fail(response, 401, '현재 비밀번호가 일치하지 않습니다')
      return
    }

    user.password = body.newPassword
    ok(response, null, 204)
    return
  }
}

async function handleProducts(request, response, url) {
  const { pathname } = url

  if (request.method === 'PUT' && pathname.startsWith('/mock-uploads/products/')) {
    await new Promise((resolve) => {
      request.on('data', () => {})
      request.on('end', resolve)
    })
    sendEmpty(response, 200)
    return
  }

  if (request.method === 'GET' && pathname.startsWith('/mock-assets/products/')) {
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    })
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#e8f0ff"/><text x="80" y="420" font-family="Arial" font-size="64" fill="#1f2937">Partion Product</text></svg>')
    return
  }

  if (request.method === 'POST' && pathname === '/api/uploads/products/presigned-url') {
    const user = getAuthenticatedUser(request)
    const body = await readBody(request, response)
    if (!body) return

    if (!user) {
      fail(response, 401, '로그인이 필요합니다')
      return
    }

    const safeFileName = String(body.fileName || 'image.jpg').replace(/[^A-Za-z0-9._-]/g, '-')
    const objectKey = `products/mock-${Date.now()}-${safeFileName}`

    ok(response, {
      presignedUrl: `http://localhost:${PORT}/mock-uploads/${objectKey}`,
      imageUrl: `http://localhost:${PORT}/mock-assets/${objectKey}`,
      objectKey,
    })
    return
  }

  if (request.method === 'GET' && pathname === '/api/products') {
    const keyword = url.searchParams.get('keyword')?.toLowerCase()
    const category = url.searchParams.get('category')
    const status = url.searchParams.get('status')
    const filtered = products.filter((product) => {
      const matchesKeyword = !keyword || product.name.toLowerCase().includes(keyword) || product.summary.toLowerCase().includes(keyword)
      const matchesCategory = !category || product.category === category || product.categoryName === category || product.categoryKey === category
      const matchesStatus = !status || product.status === status || (status === 'FUNDING' && product.status === 'RECRUITING')
      return matchesKeyword && matchesCategory && matchesStatus
    })
    ok(response, paginate(filtered, url))
    return
  }

  if (request.method === 'GET' && pathname === '/api/products/me') {
    const user = getAuthenticatedUser(request)

    if (!user) {
      fail(response, 401, '로그인이 필요합니다')
      return
    }

    ok(response, paginate(products.filter((product) => product.issuerId === user.id), url))
    return
  }

  if (request.method === 'GET' && /^\/api\/products\/detail\/\d+$/.test(pathname)) {
    const product = findProduct(pathname.split('/').at(-1))
    product ? ok(response, product) : fail(response, 404, '상품을 찾을 수 없습니다')
    return
  }

  if (request.method === 'GET' && /^\/api\/products\/\d+\/orderbook$/.test(pathname)) {
    const product = findProduct(pathname.split('/')[3])
    if (!product) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    const depth = Math.max(1, toInt(url.searchParams.get('depth'), 10))
    const asks = Array.from({ length: depth }, (_, index) => ({
      price: product.unitPrice + (index + 1) * 100,
      quantity: 20 + index * 3,
    }))
    const bids = Array.from({ length: depth }, (_, index) => ({
      price: Math.max(100, product.unitPrice - (index + 1) * 100),
      quantity: 18 + index * 2,
    }))

    ok(response, {
      productId: product.id,
      asks,
      bids,
    })
    return
  }

  if (request.method === 'POST' && pathname === '/api/products') {
    const user = getAuthenticatedUser(request)
    const body = await readBody(request, response)
    if (!body) return

    if (!user) {
      fail(response, 401, '로그인이 필요합니다')
      return
    }

    if (!body.name && !body.title) {
      fail(response, 400, '상품 정보를 확인해주세요')
      return
    }

    const product = {
      id: nextProductId,
      productId: nextProductId,
      symbol: body.symbol || `MOCK-${nextProductId}`,
      name: body.name || body.title,
      title: body.title || body.name,
      category: body.category || 'MUSIC',
      categoryName: body.categoryName || categoryNameFromCode(body.category),
      summary: body.summary || '로컬 mock 등록 상품',
      description: body.description || '로컬 mock 등록 상품 상세 설명입니다.',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
      status: 'FUNDING',
      unitPrice: body.unitPrice || body.tokenPrice || 10000,
      tokenPrice: body.tokenPrice || body.unitPrice || 10000,
      targetAmount: body.targetAmount || 1000000,
      currentAmount: 0,
      fundedAmount: 0,
      fundingRate: 0,
      expectedYield: body.expectedYield || 'mock 수익률',
      subscriptionPeriod: body.subscriptionPeriod || '2026.06.01 - 2026.07.01',
      open: true,
      totalTokens: Math.floor((body.targetAmount || 1000000) / (body.tokenPrice || body.unitPrice || 10000)),
      remainingTokens: Math.floor((body.targetAmount || 1000000) / (body.tokenPrice || body.unitPrice || 10000)),
      issuerId: user.id,
      issuerMemberId: user.id,
      issuerNickname: user.nickname,
      createdAt: nowIso(),
    }
    nextProductId += 1
    products.push(product)
    ok(response, product, 201)
    return
  }

  if ((request.method === 'PATCH' || request.method === 'PUT') && /^\/api\/products\/\d+$/.test(pathname)) {
    const product = findProduct(pathname.split('/').at(-1))
    if (!product) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    const body = await readBody(request, response)
    if (!body) return
    Object.assign(product, body, { updatedAt: nowIso() })
    ok(response, product)
    return
  }

  if (request.method === 'DELETE' && /^\/api\/products\/\d+$/.test(pathname)) {
    const productIndex = products.findIndex((product) => product.id === Number(pathname.split('/').at(-1)))
    if (productIndex === -1) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    products.splice(productIndex, 1)
    ok(response, null)
    return
  }
}

async function handleInvestments(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && pathname === '/api/investment-products') {
    ok(response, paginate(products.filter((product) => product.open || product.status === 'RECRUITING'), url))
    return
  }

  if (request.method === 'GET' && /^\/api\/investment-products\/\d+$/.test(pathname)) {
    const product = findProduct(pathname.split('/').at(-1))
    product ? ok(response, product) : fail(response, 404, '상품을 찾을 수 없습니다')
    return
  }

  if (request.method === 'POST' && /^\/api\/investment-products\/\d+\/invest$/.test(pathname)) {
    const product = findProduct(pathname.split('/')[3])
    if (!product) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    const body = await readBody(request, response)
    if (!body) return
    const amount = Number(body.amount || body.totalAmount || product.unitPrice)
    const quantity = Number(body.quantity || Math.max(1, Math.floor(amount / product.unitPrice)))

    if (amount <= 0 || quantity <= 0) {
      fail(response, 400, '투자 정보를 확인해주세요')
      return
    }

    const investment = {
      id: nextInvestmentId,
      productId: product.id,
      productName: product.name,
      amount,
      quantity,
      status: 'COMPLETED',
      investedAt: nowIso(),
    }
    nextInvestmentId += 1
    investments.unshift(investment)
    product.currentAmount += amount
    product.fundedAmount += amount
    product.fundingRate = Number(((product.fundedAmount / product.targetAmount) * 100).toFixed(1))
    wallet.balance -= amount
    wallet.availableBalance -= amount
    addLedgerBlock('INVESTMENT', investment)
    ok(response, investment, 201)
    return
  }

  if (request.method === 'GET' && pathname === '/api/investments/me') {
    ok(response, paginate(investments, url))
    return
  }
}

async function handleOrdersAndTrades(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && (pathname === '/api/market/products' || pathname === '/api/trading-products')) {
    ok(response, paginate(products.filter((product) => !product.open || product.status === 'TRADING'), url))
    return
  }

  if (request.method === 'POST' && pathname === '/api/orders') {
    const body = await readBody(request, response)
    if (!body) return

    const product = findProduct(body.productId)
    if (!product) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    const quantity = Number(body.quantity)
    const price = Number(body.price || product.unitPrice)

    if (quantity <= 0 || price <= 0) {
      fail(response, 400, '주문 정보를 확인해주세요')
      return
    }

    const order = {
      id: nextOrderId,
      productId: product.id,
      productName: product.name,
      side: body.side || 'BUY',
      orderType: body.orderType || 'LIMIT',
      price,
      quantity,
      filledQuantity: 0,
      remainingQuantity: quantity,
      status: 'OPEN',
      createdAt: nowIso(),
    }
    nextOrderId += 1
    orders.unshift(order)
    ok(response, order, 201)
    return
  }

  if (request.method === 'GET' && pathname === '/api/orders/me') {
    const status = url.searchParams.get('status')
    const filtered = status ? orders.filter((order) => order.status === status) : orders
    ok(response, paginate(filtered, url))
    return
  }

  if (
    (request.method === 'PATCH' || request.method === 'POST') &&
    (/^\/api\/orders\/\d+\/cancel$/.test(pathname) || /^\/api\/orders\/\d+\/cancel-request$/.test(pathname))
  ) {
    const order = orders.find((item) => item.id === Number(pathname.split('/')[3]))
    if (!order) {
      fail(response, 404, '주문을 찾을 수 없습니다')
      return
    }

    if (order.status !== 'OPEN') {
      fail(response, 409, '취소할 수 없는 주문입니다')
      return
    }

    order.status = 'CANCELLED'
    order.cancelledAt = nowIso()
    ok(response, order)
    return
  }

  if (request.method === 'GET' && pathname === '/api/trades/me') {
    const side = url.searchParams.get('side')
    const filtered = side ? trades.filter((trade) => trade.side === side) : trades
    ok(response, paginate(filtered, url))
    return
  }

  if (
    request.method === 'GET' &&
    (/^\/api\/products\/\d+\/trades\/recent$/.test(pathname) || /^\/api\/trades\/products\/\d+\/recent$/.test(pathname))
  ) {
    const productId = pathname.startsWith('/api/products') ? Number(pathname.split('/')[3]) : Number(pathname.split('/')[4])
    ok(response, trades.filter((trade) => trade.productId === productId).slice(0, 20))
    return
  }
}

function handlePortfolio(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && pathname === '/api/holdings/me') {
    ok(response, [
      {
        productId: 2,
        productName: products[1]?.name,
        quantity: 50,
        averagePrice: 10000,
        currentPrice: 10300,
      },
      {
        productId: 7,
        productName: products[6]?.name,
        quantity: 4,
        averagePrice: 10100,
        currentPrice: 10200,
      },
    ])
    return
  }

  if (request.method === 'GET' && pathname === '/api/portfolio/summary') {
    ok(response, {
      totalAssetAmount: 4520800,
      cashBalance: wallet.availableBalance,
      investmentAmount: 1320800,
      profitLoss: 70800,
      profitRate: 5.66,
    })
    return
  }

  if (request.method === 'GET' && pathname === '/api/portfolio/assets') {
    ok(response, paginate([
      {
        productId: 2,
        productName: products[1]?.name,
        category: products[1]?.category,
        quantity: 50,
        valuationAmount: 515000,
        profitLoss: 15000,
      },
      {
        productId: 7,
        productName: products[6]?.name,
        category: products[6]?.category,
        quantity: 4,
        valuationAmount: 40800,
        profitLoss: 400,
      },
    ], url))
  }
}

async function handleWalletsAndPayments(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && pathname === '/api/wallets/me') {
    ok(response, wallet)
    return
  }

  if (request.method === 'GET' && pathname === '/api/wallets/me/transactions') {
    ok(response, paginate(walletTransactions, url))
    return
  }

  if (request.method === 'POST' && pathname === '/api/payments/toss/deposits') {
    const body = await readBody(request, response)
    if (!body) return

    const amount = Number(body.amount)
    if (amount <= 0) {
      fail(response, 400, '충전 금액을 확인해주세요')
      return
    }

    const payment = {
      id: nextPaymentId,
      paymentKey: `mock-payment-key-${nextPaymentId}`,
      orderId: body.orderId || `deposit-${nextPaymentId}`,
      amount,
      status: 'READY',
      method: 'TOSS',
      checkoutUrl: `http://localhost:${PORT}/mock/toss/checkout/${nextPaymentId}`,
      requestedAt: nowIso(),
    }
    nextPaymentId += 1
    payments.unshift(payment)
    ok(response, payment, 201)
    return
  }

  if (request.method === 'POST' && pathname === '/api/payments/toss/confirm') {
    const body = await readBody(request, response)
    if (!body) return

    const payment = payments.find((item) => item.paymentKey === body.paymentKey) || payments[0]
    payment.status = 'DONE'
    payment.approvedAt = nowIso()
    wallet.balance += payment.amount
    wallet.availableBalance += payment.amount
    walletTransactions.unshift({
      id: walletTransactions.length + 1,
      type: 'DEPOSIT',
      amount: payment.amount,
      balanceAfter: wallet.balance,
      description: 'Toss 충전 승인',
      createdAt: nowIso(),
    })
    addLedgerBlock('DEPOSIT', payment)
    ok(response, payment)
    return
  }

  if (request.method === 'GET' && pathname === '/api/payments/deposits/me') {
    ok(response, paginate(payments, url))
  }
}

async function handleBoards(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && pathname === '/api/boards') {
    const category = url.searchParams.get('category')
    const keyword = url.searchParams.get('keyword')?.toLowerCase()
    const filtered = boards.filter((board) => {
      const matchesCategory = !category || board.category === category
      const matchesKeyword = !keyword || board.title.toLowerCase().includes(keyword) || board.content.toLowerCase().includes(keyword)
      return matchesCategory && matchesKeyword
    })
    ok(response, paginate(filtered, url))
    return
  }

  if (request.method === 'GET' && /^\/api\/boards\/\d+$/.test(pathname)) {
    const board = boards.find((item) => item.id === Number(pathname.split('/').at(-1)))
    if (!board) {
      fail(response, 404, '게시글을 찾을 수 없습니다')
      return
    }

    board.viewCount += 1
    ok(response, board)
    return
  }

  if (request.method === 'POST' && pathname === '/api/boards') {
    const user = getAuthenticatedUser(request)
    const body = await readBody(request, response)
    if (!body) return

    if (!user) {
      fail(response, 401, '로그인이 필요합니다')
      return
    }

    if (!body.title || !body.content) {
      fail(response, 400, '게시글 정보를 확인해주세요')
      return
    }

    const board = {
      id: nextBoardId,
      category: body.category || 'FREE',
      title: body.title,
      content: body.content,
      writerId: user.id,
      writerNickname: user.nickname,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      viewCount: 0,
    }
    nextBoardId += 1
    boards.unshift(board)
    ok(response, board, 201)
    return
  }

  if ((request.method === 'PATCH' || request.method === 'PUT') && /^\/api\/boards\/\d+$/.test(pathname)) {
    const board = boards.find((item) => item.id === Number(pathname.split('/').at(-1)))
    if (!board) {
      fail(response, 404, '게시글을 찾을 수 없습니다')
      return
    }

    const body = await readBody(request, response)
    if (!body) return
    Object.assign(board, body, { updatedAt: nowIso() })
    ok(response, board)
    return
  }

  if (request.method === 'DELETE' && /^\/api\/boards\/\d+$/.test(pathname)) {
    const boardId = Number(pathname.split('/').at(-1))
    const index = boards.findIndex((item) => item.id === boardId)
    if (index === -1) {
      fail(response, 404, '게시글을 찾을 수 없습니다')
      return
    }

    boards.splice(index, 1)
    for (let index = comments.length - 1; index >= 0; index -= 1) {
      if (comments[index].boardId === boardId) {
        comments.splice(index, 1)
      }
    }
    ok(response, null, 204)
    return
  }

  if (request.method === 'GET' && /^\/api\/boards\/\d+\/comments$/.test(pathname)) {
    const boardId = Number(pathname.split('/')[3])
    ok(response, comments.filter((comment) => comment.boardId === boardId))
    return
  }

  if (request.method === 'POST' && /^\/api\/boards\/\d+\/comments$/.test(pathname)) {
    const boardId = Number(pathname.split('/')[3])
    const user = getAuthenticatedUser(request)
    const body = await readBody(request, response)
    if (!body) return

    if (!user) {
      fail(response, 401, '로그인이 필요합니다')
      return
    }

    if (!body.content) {
      fail(response, 400, '댓글 내용을 입력해주세요')
      return
    }

    const comment = {
      id: nextCommentId,
      boardId,
      content: body.content,
      writerId: user.id,
      writerNickname: user.nickname,
      createdAt: nowIso(),
    }
    nextCommentId += 1
    comments.push(comment)
    ok(response, comment, 201)
    return
  }

  if (request.method === 'DELETE' && /^\/api\/comments\/\d+$/.test(pathname)) {
    const index = comments.findIndex((item) => item.id === Number(pathname.split('/').at(-1)))
    if (index === -1) {
      fail(response, 404, '댓글을 찾을 수 없습니다')
      return
    }

    comments.splice(index, 1)
    ok(response, null, 204)
  }
}

function handleLedger(request, response, url) {
  const { pathname } = url

  if (request.method === 'GET' && pathname === '/api/ledger/blocks') {
    ok(response, paginate(ledgerBlocks, url))
    return
  }

  if (request.method === 'GET' && /^\/api\/ledger\/blocks\/\d+$/.test(pathname)) {
    const block = ledgerBlocks.find((item) => item.id === Number(pathname.split('/').at(-1)))
    block ? ok(response, block) : fail(response, 404, '블록을 찾을 수 없습니다')
  }
}

async function handleAiReports(request, response, url) {
  const { pathname } = url

  if (request.method !== 'POST') return

  if (/^\/api\/ai\/products\/\d+\/investment-report$/.test(pathname)) {
    const product = findProduct(pathname.split('/')[4])
    if (!product) {
      fail(response, 404, '상품을 찾을 수 없습니다')
      return
    }

    ok(response, {
      productId: product.id,
      title: `${product.name} 투자 리포트`,
      message: `${product.name}은 현재 ${product.fundingRate}% 모집률이며, 로컬 mock 기준으로 분산 투자 관점에서 검토할 수 있습니다.`,
      generatedAt: nowIso(),
    })
    return
  }

  if (/^\/api\/ai\/orders\/\d+\/report$/.test(pathname)) {
    const order = orders.find((item) => item.id === Number(pathname.split('/')[4]))
    if (!order) {
      fail(response, 404, '주문을 찾을 수 없습니다')
      return
    }

    ok(response, {
      orderId: order.id,
      title: `주문 ${order.id} 리포트`,
      message: `${order.side} 주문 ${order.quantity}주 중 ${order.filledQuantity}주가 체결되었습니다.`,
      generatedAt: nowIso(),
    })
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, null)
    return
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    ok(response, {
      service: 'partion-local-mock-api',
      users: users.size,
      products: products.length,
      boards: boards.length,
    })
    return
  }

  const handlers = [
    handleAuth,
    handleMembers,
    handleProducts,
    handleInvestments,
    handleOrdersAndTrades,
    handlePortfolio,
    handleWalletsAndPayments,
    handleBoards,
    handleLedger,
    handleAiReports,
  ]

  for (const handler of handlers) {
    const completed = response.writableEnded
    if (completed) return

    await handler(request, response, url)
  }

  if (!response.writableEnded) {
    fail(response, 404, '지원하지 않는 API입니다.')
  }
})

server.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`)
  console.log('Health check: GET /health')
})
