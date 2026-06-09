import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  it('shows login and signup when signed out', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        activeView: 'products',
      },
    })

    expect(wrapper.text()).toContain('로그인')
    expect(wrapper.text()).toContain('회원가입')
    expect(wrapper.text()).not.toContain('로그아웃')

    await wrapper.get('.nav-login-button').trigger('click')
    await wrapper.get('.nav-signup-button').trigger('click')

    expect(wrapper.emitted('navigate')?.[0]).toEqual(['login'])
    expect(wrapper.emitted('navigate')?.[1]).toEqual(['signup'])
  })

  it('shows user controls and emits logout when signed in', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        activeView: 'products',
        isAuthenticated: true,
        user: {
          nickname: 'user123',
          email: 'user123@example.com',
        },
      },
    })

    expect(wrapper.text()).toContain('내 정보')
    expect(wrapper.text()).toContain('로그아웃')
    expect(wrapper.text()).not.toContain('user123님')
    expect(wrapper.text()).not.toContain('회원가입')

    await wrapper.get('.nav-user-button').trigger('click')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['profile'])

    await wrapper.get('.nav-logout-button').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })
})
