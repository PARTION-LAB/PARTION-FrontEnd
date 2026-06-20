import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AuthView from './AuthView.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'login',
  }),
}))

describe('AuthView', () => {
  afterEach(() => {
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
    expect(wrapper.text()).toContain('이메일 인증번호 확인을 완료해주세요.')
  })

  it('sends and verifies email before submitting signup data', async () => {
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
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.get('.verification-check-button').trigger('click')
    await Promise.resolve()
    await Promise.resolve()
    await wrapper.get('input[autocomplete="new-password"]').setValue('securePassword123!')
    await wrapper.get('.auth-form').trigger('submit')
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
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/email\/verify$/)
    expect(fetchMock.mock.calls[1][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user123@example.com',
        purpose: 'SIGNUP',
        code: '123456',
      }),
    })
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/api\/auth\/signup$/)
    expect(fetchMock.mock.calls[2][1]).toEqual({
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
