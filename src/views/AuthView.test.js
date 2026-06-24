import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AuthView from './AuthView.vue'

let mockRoute = {
  name: 'login',
  query: {},
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

describe('AuthView', () => {
  afterEach(() => {
    mockRoute = {
      name: 'login',
      query: {},
    }
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('submits login data to the login API and stores the access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          accessToken: 'mock-access-token',
          tokenType: 'Bearer',
          expiresIn: 1800,
          member: {
            email: 'user123@example.com',
            nickname: 'user123',
          },
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('input[autocomplete="current-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/login$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user123@example.com',
        password: 'securePassword123!',
      }),
    })
    expect(localStorage.getItem('partionAccessToken')).toBe('mock-access-token')
    expect(localStorage.getItem('partionRefreshToken')).toBeNull()
    expect(JSON.parse(localStorage.getItem('partionMember'))).toEqual({
      email: 'user123@example.com',
      nickname: 'user123',
    })
    expect(wrapper.text()).toContain('로그인되었습니다.')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['products'])
  })

  it('stores the access token when login response has no member payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          accessToken: 'deployed-access-token',
          tokenType: 'Bearer',
          expiresIn: 1800,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('input[autocomplete="current-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

    expect(localStorage.getItem('partionAccessToken')).toBe('deployed-access-token')
    expect(localStorage.getItem('partionMember')).toBeNull()
    expect(wrapper.text()).toContain('로그인되었습니다.')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['products'])
  })

  it('returns to the redirect page after login', async () => {
    mockRoute = {
      name: 'login',
      query: {
        redirect: '/market?asset=music',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({
          accessToken: 'redirect-access-token',
          tokenType: 'Bearer',
          expiresIn: 1800,
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('input[autocomplete="current-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

    expect(localStorage.getItem('partionAccessToken')).toBe('redirect-access-token')
    expect(wrapper.emitted('navigate')?.[0]).toEqual([{ path: '/market?asset=music' }])
  })

  it('shows an error and stays on login when login response has no access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<!doctype html><html></html>'),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('input[autocomplete="current-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

    expect(localStorage.getItem('partionAccessToken')).toBeNull()
    expect(wrapper.text()).toContain('로그인 응답에서 인증 토큰을 확인하지 못했습니다.')
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('shows signup validation before calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.find('.auth-tabs button:nth-child(2)').trigger('click')
    await wrapper.get('input[autocomplete="nickname"]').setValue('a')
    await wrapper.get('input[autocomplete="email"]').setValue('bad-email')
    await wrapper.get('input[autocomplete="new-password"]').setValue('123')
    await wrapper.get('.auth-form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('닉네임은 2자 이상 10자 이하로 입력해주세요.')
  })

  it('requires email verification before signup', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.find('.auth-tabs button:nth-child(2)').trigger('click')
    await wrapper.get('input[autocomplete="nickname"]').setValue('user123')
    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('input[autocomplete="new-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('이메일 인증을 완료해주세요.')
  })

  it('sends email verification link for signup', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true, response: null, error: null })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.find('.auth-tabs button:nth-child(2)').trigger('click')
    await wrapper.get('input[autocomplete="nickname"]').setValue('user123')
    await wrapper.get('input[autocomplete="email"]').setValue('user123@example.com')
    await wrapper.get('.verification-send-button').trigger('click')
    await Promise.resolve()
    await Promise.resolve()

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
    expect(wrapper.text()).toContain('인증 메일을 발송했습니다.')
  })

  it('submits signup data after email verification redirect', async () => {
    mockRoute = {
      name: 'signup',
      query: {
        emailVerified: 'true',
        email: 'user123@example.com',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true, response: null, error: null })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AuthView)

    await wrapper.get('input[autocomplete="nickname"]').setValue('user123')
    await wrapper.get('input[autocomplete="new-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/signup$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: 'user123',
        email: 'user123@example.com',
        password: 'securePassword123!',
      }),
    })
    expect(wrapper.text()).toContain('회원가입이 완료되었습니다. 로그인해 주세요.')
  })
})
