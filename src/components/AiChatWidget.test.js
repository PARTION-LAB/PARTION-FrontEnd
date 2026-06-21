import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AiChatWidget from './AiChatWidget.vue'

describe('AiChatWidget', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('asks users to sign in before chatting', async () => {
    const wrapper = mount(AiChatWidget)

    await wrapper.get('.ai-chat-toggle').trigger('click')
    expect(wrapper.text()).toContain('로그인 후 AI 가이드를 이용할 수 있어요.')

    await wrapper.get('.ai-chat-login button').trigger('click')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['login'])
  })

  it('sends a message and renders the AI answer', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({
          answer: '투자는 FUNDING 상태 상품에 참여하는 과정입니다.',
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AiChatWidget, {
      props: {
        isAuthenticated: true,
      },
    })

    await wrapper.get('.ai-chat-toggle').trigger('click')
    await wrapper.get('.ai-chat-form input').setValue('투자는 뭐야?')
    await wrapper.get('.ai-chat-form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('투자는 FUNDING 상태 상품에 참여하는 과정입니다.')
    })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/ai\/chat$/)
  })
})
