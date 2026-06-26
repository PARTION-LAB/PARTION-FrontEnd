import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProducts } from '../api/products'
import ProductCard from '../components/common/ProductCard.vue'
import HomeView from './HomeView.vue'

vi.mock('../api/products', () => ({
  getProducts: vi.fn(),
}))

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: HomeView,
      },
    ],
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    getProducts.mockReset()
    getProducts.mockResolvedValue({
      content: [
        {
          productId: 42,
          symbol: 'INVEST-42',
          category: 'Real Estate',
          categoryKey: 'real-estate',
          name: 'Selected Investment Product',
          summary: 'Investment product used for routing test.',
          imageUrl: 'https://example.com/product.jpg',
          status: 'FUNDING',
          statusLabel: 'Funding',
          unitPrice: 10000,
          targetAmount: 1000000,
          fundedAmount: 250000,
          expectedYield: '5%',
          subscriptionPeriod: '2026.01.01 - 2026.12.31',
          action: 'Invest',
          open: true,
        },
      ],
    })
  })

  it('navigates to the selected investment product', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await wrapper.findComponent(ProductCard).find('.action-button').trigger('click')

    expect(wrapper.emitted('navigate')?.[0]).toEqual([
      {
        name: 'invest',
        query: {
          productId: '42',
        },
      },
    ])
  })
})
