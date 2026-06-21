import { afterEach, describe, expect, it, vi } from 'vitest'
import {
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
