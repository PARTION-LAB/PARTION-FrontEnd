import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendAiChatMessage } from './ai'

describe('ai API', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('calls AI chat API with access token', async () => {
    localStorage.setItem('partionAccessToken', 'mock-access-token')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({
          answer: '투자는 모집 참여이고 거래는 모집 완료 후 토큰을 사고파는 과정입니다.',
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendAiChatMessage({
      message: '투자와 거래는 뭐가 달라?',
    })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/ai\/chat$/)
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-access-token',
      },
      body: JSON.stringify({
        message: '투자와 거래는 뭐가 달라?',
      }),
    })
    expect(result.answer).toContain('투자')
  })

  it('retries AI chat API after access token reissue', async () => {
    localStorage.setItem('partionAccessToken', 'expired-access-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(JSON.stringify({
            accessToken: 'new-access-token',
          })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(JSON.stringify({
            answer: 'Partion은 학습 목적의 STO 시뮬레이션 서비스입니다.',
          })),
      })
    vi.stubGlobal('fetch', fetchMock)

    await sendAiChatMessage({
      message: 'Partion이 뭐야?',
    })

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer expired-access-token')
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/reissue$/)
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access-token')
  })
})
