import { afterEach, describe, expect, it, vi } from 'vitest'
import { logoutUser, reissueAccessToken } from './auth'

describe('auth API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('calls logout API with access token and refresh token', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')
    localStorage.setItem('partionRefreshToken', 'mock-refresh-token')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true, response: null, error: null })),
    })
    vi.stubGlobal('fetch', fetchMock)

    await logoutUser()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/logout$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-access-token',
      },
      body: JSON.stringify({
        refreshToken: 'mock-refresh-token',
      }),
    })
  })

  it('calls reissue API with refresh token', async () => {
    localStorage.setItem('partionRefreshToken', 'mock-refresh-token')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          success: true,
          response: {
            accessToken: 'mock-access-token-reissued',
            refreshToken: 'mock-refresh-token-reissued',
            tokenType: 'Bearer',
            expiresIn: 1800,
          },
          error: null,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await reissueAccessToken()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/reissue$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'mock-refresh-token',
      }),
    })
    expect(result.response.accessToken).toBe('mock-access-token-reissued')
  })
})
