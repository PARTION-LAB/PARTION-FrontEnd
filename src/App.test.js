import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import AppHeader from './components/layout/AppHeader.vue'
import { useAuth } from './composables/useAuth'
import router from './router'

describe('App', () => {
  it('renders the Partion product experience', async () => {
    window.scrollTo = vi.fn()
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Partion STO')
    expect(wrapper.text()).toContain('목표 투자금 달성률로 보는 STO 상품')
  })
  it('adds the current page as login redirect', async () => {
    window.scrollTo = vi.fn()
    useAuth().clearSession()
    await router.push('/board/write')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    wrapper.findComponent(AppHeader).vm.$emit('navigate', 'login')
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/board/write')
  })
})
