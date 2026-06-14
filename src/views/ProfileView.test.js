import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProfileView from './ProfileView.vue'

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

describe('ProfileView', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('loads and updates my profile', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: 'user123',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: '새닉네임',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ProfileView)
    await flushPromises()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/members\/me$/)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer mock-access-token')
    expect(wrapper.get('input[autocomplete="email"]').element.value).toBe('user123@example.com')
    expect(wrapper.get('input[autocomplete="nickname"]').element.value).toBe('user123')

    await wrapper.get('input[autocomplete="nickname"]').setValue('새닉네임')
    await wrapper.get('.profile-form').trigger('submit')
    await flushPromises()

    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/members\/me$/)
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({
        nickname: '새닉네임',
      }),
    })
    expect(wrapper.text()).toContain('내 정보가 저장되었습니다.')
    expect(JSON.parse(localStorage.getItem('partionMember')).nickname).toBe('새닉네임')
  })

  it('reissues access token and retries loading my profile when token is expired', async () => {
    localStorage.setItem('partionAccessToken', 'expired-access-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: false,
            response: null,
            error: 'access token이 만료되었습니다',
          })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            accessToken: 'new-access-token',
            tokenType: 'Bearer',
            expiresIn: 1800,
          })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: 'user123',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ProfileView)
    await flushPromises()

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/members\/me$/)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer expired-access-token')
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/reissue$/)
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
    })
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/api\/members\/me$/)
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access-token')
    expect(localStorage.getItem('partionAccessToken')).toBe('new-access-token')
    expect(localStorage.getItem('partionRefreshToken')).toBeNull()
    expect(wrapper.get('input[autocomplete="email"]').element.value).toBe('user123@example.com')
  })

  it('updates my password', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: 'user123',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: 'user123',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ProfileView)
    await flushPromises()

    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0].setValue('securePassword123!')
    await passwordInputs[1].setValue('newPassword123!')
    await wrapper.findAll('.profile-form')[1].trigger('submit')
    await flushPromises()

    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/members\/me\/password$/)
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'securePassword123!',
        newPassword: 'newPassword123!',
      }),
    })
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/api\/members\/me$/)
    expect(wrapper.text()).toContain('비밀번호가 변경되었습니다. 내 정보도 최신 상태로 유지됩니다.')
  })

  it('shows password error messages without exposing status code', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: true,
            response: {
              id: 1,
              email: 'user123@example.com',
              nickname: 'user123',
              provider: 'LOCAL',
              role: 'USER',
              createdAt: '2026-06-04T09:39:23',
            },
            error: null,
          })),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () =>
          Promise.resolve(JSON.stringify({
            success: false,
            response: null,
            error: '현재 비밀번호가 일치하지 않습니다',
          })),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ProfileView)
    await flushPromises()

    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0].setValue('wrongPassword123!')
    await passwordInputs[1].setValue('newPassword123!')
    await wrapper.findAll('.profile-form')[1].trigger('submit')
    await flushPromises()

    const passwordPanel = wrapper.findAll('.profile-panel')[1]
    expect(passwordPanel.text()).not.toContain('401')
    expect(passwordPanel.text()).toContain('현재 비밀번호가 일치하지 않습니다.')
  })
})
