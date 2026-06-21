import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOrderBook, getRecentTrades } from './trading'

describe('trading API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the public order book from the trading product endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({
          productId: 10,
          asks: [],
          bids: [],
        })),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getOrderBook(10, { depth: 10 })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/trading/products/10/orderbook?depth=10')
    expect(fetchMock.mock.calls[0][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('loads recent trades from the trading product endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify([])),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getRecentTrades(10, { size: 20 })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/trading/products/10/trades?size=20')
  })
})
