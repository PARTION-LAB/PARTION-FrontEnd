import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from './App.vue'
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
})
