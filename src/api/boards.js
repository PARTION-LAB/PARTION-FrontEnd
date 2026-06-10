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

export function normalizeBoard(board) {
  if (!board) {
    return null
  }

  return {
    ...board,
    boardId: board.boardId ?? board.id,
    memberId: board.memberId ?? board.writerId,
    content: board.content || board.body || '',
    writerNickname: board.writerNickname || board.authorName,
  }
}

export function normalizeComment(comment) {
  if (!comment) {
    return null
  }

  return {
    ...comment,
    commentId: comment.commentId ?? comment.id,
    memberId: comment.memberId ?? comment.writerId,
    writerNickname: comment.writerNickname || comment.authorName,
  }
}

export async function getBoards({ category, keyword, page = 0, size = 20 } = {}) {
  const data = await handleResponse(
    await request(appendQuery('/api/boards', { category, keyword, page, size })),
    '게시글 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeBoard),
  }
}

export async function getBoard(boardId) {
  return normalizeBoard(
    await handleResponse(
      await request(`/api/boards/${boardId}`),
      '게시글 상세 정보를 불러오지 못했습니다.',
    ),
  )
}

export async function createBoard({ category, title, content }) {
  return normalizeBoard(
    await handleResponse(
      await request('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ category, title, content }),
      }, { auth: true }),
      '게시글을 작성하지 못했습니다.',
    ),
  )
}

export async function updateBoard(boardId, { category, title, content }) {
  return normalizeBoard(
    await handleResponse(
      await request(`/api/boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ category, title, content }),
      }, { auth: true }),
      '게시글을 수정하지 못했습니다.',
    ),
  )
}

export async function deleteBoard(boardId) {
  await handleResponse(
    await request(`/api/boards/${boardId}`, { method: 'DELETE' }, { auth: true }),
    '게시글을 삭제하지 못했습니다.',
  )
}

export async function getBoardComments(boardId, { page = 0, size = 20, sort = 'createdAt,asc' } = {}) {
  const data = await handleResponse(
    await request(appendQuery(`/api/boards/${boardId}/comments`, { page, size, sort })),
    '댓글 목록을 불러오지 못했습니다.',
  )
  const pageData = normalizePage(data)

  return {
    ...pageData,
    content: pageData.content.map(normalizeComment),
  }
}

export async function createComment(boardId, { content }) {
  return normalizeComment(
    await handleResponse(
      await request(`/api/boards/${boardId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }, { auth: true }),
      '댓글을 작성하지 못했습니다.',
    ),
  )
}

export async function deleteComment(commentId) {
  await handleResponse(
    await request(`/api/comments/${commentId}`, { method: 'DELETE' }, { auth: true }),
    '댓글을 삭제하지 못했습니다.',
  )
}
