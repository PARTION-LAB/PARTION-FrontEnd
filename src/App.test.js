import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from './App.vue'

describe('App', () => {
  it('renders the Partion product experience', () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('Partion STO')
    expect(wrapper.text()).toContain('목표 투자금 달성률로 보는 STO 상품')
  })
})
