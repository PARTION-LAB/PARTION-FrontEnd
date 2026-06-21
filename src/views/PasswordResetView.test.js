import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PasswordResetView from './PasswordResetView.vue'

let mockRoute = {
  query: {},
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

describe('PasswordResetView', () => {
  afterEach(() => {
    mockRoute = {
      query: {},
    }
    vi.unstubAllGlobals()
  })

  it('sends password reset verification email', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ email: 'user123@example.com', purpose: 'PASSWORD_RESET', expiresIn: 300 })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(PasswordResetView)

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
        purpose: 'PASSWORD_RESET',
      }),
    })
    expect(wrapper.text()).toContain('비밀번호 재설정 인증 메일을 발송했습니다.')
  })

  it('submits password reset after email verification redirect', async () => {
    mockRoute = {
      query: {
        emailVerified: 'true',
        email: 'user123@example.com',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ email: 'user123@example.com' })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(PasswordResetView)

    await wrapper.get('input[autocomplete="new-password"]').setValue('newPassword123!')
    await wrapper.get('.auth-form').trigger('submit')
    await Promise.resolve()
    await Promise.resolve()

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
    expect(wrapper.text()).toContain('비밀번호가 재설정되었습니다.')
  })
})
