import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getGoogleOAuthAuthorizationUrl,
  getOAuthAuthorizationUrl,
  loginWithGoogleOAuthCode,
  logoutUser,
  reissueAccessToken,
  resetPassword,
  sendEmailVerificationLink,
} from './auth'

describe('auth API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('calls logout API with access token and cookie credentials', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true, response: null, error: null })),
    })
    vi.stubGlobal('fetch', fetchMock)

    await logoutUser()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/logout$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-access-token',
      },
    })
  })

  it('calls reissue API with cookie credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          accessToken: 'mock-access-token-reissued',
          tokenType: 'Bearer',
          expiresIn: 1800,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await reissueAccessToken()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/reissue$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(result.accessToken).toBe('mock-access-token-reissued')
  })

  it('calls email verification send API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          email: 'user123@example.com',
          purpose: 'SIGNUP',
          expiresIn: 300,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmailVerificationLink({
      email: 'user123@example.com',
      purpose: 'SIGNUP',
    })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/email\/send$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user123@example.com',
        purpose: 'SIGNUP',
      }),
    })
    expect(result.expiresIn).toBe(300)
  })

  it('gets Google OAuth authorization URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          state: 'google-state',
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getGoogleOAuthAuthorizationUrl()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/oauth\/google\/authorization-url$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(result.state).toBe('google-state')
  })

  it('logs in with Google OAuth code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          accessToken: 'google-access-token',
          tokenType: 'Bearer',
          expiresIn: 1800,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loginWithGoogleOAuthCode({
      code: 'google-code',
      state: 'google-state',
    })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/oauth\/google\/login$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'google-code',
        state: 'google-state',
      }),
    })
    expect(result.accessToken).toBe('google-access-token')
  })

  it('gets Kakao OAuth authorization URL through the shared provider path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          authorizationUrl: 'https://kauth.kakao.com/oauth/authorize',
          state: 'kakao-state',
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOAuthAuthorizationUrl('kakao')

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/oauth\/kakao\/authorization-url$/)
    expect(result.state).toBe('kakao-state')
  })

  it('calls password reset API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          email: 'user123@example.com',
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resetPassword({
      email: 'user123@example.com',
      newPassword: 'newPassword123!',
    })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/password\/reset$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user123@example.com',
        newPassword: 'newPassword123!',
      }),
    })
    expect(result.email).toBe('user123@example.com')
  })
})
