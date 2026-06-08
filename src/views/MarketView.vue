<script setup>
import { computed, ref, watch } from 'vue'
import { products } from '../data/products'
import { formatWon } from '../utils/formatters'

const tradableProducts = products.filter((product) => !product.open)
const selectedSymbol = ref(tradableProducts[0]?.symbol || products[0]?.symbol)
const selectedSide = ref('buy')
const selectedOrderType = ref('limit')
const orderPrice = ref(0)
const orderQuantity = ref(1)
const depositAmount = ref(100000)
const tradeMessage = ref('로그인하지 않아도 호가창과 최근 체결은 확인할 수 있습니다.')

const selectedProduct = computed(() => {
  return (
    tradableProducts.find((product) => product.symbol === selectedSymbol.value) ||
    tradableProducts[0] ||
    products[0]
  )
})

const marketPrice = computed(() => {
  if (!selectedProduct.value) {
    return 0
  }

  const productIndex = products.findIndex(
    (product) => product.symbol === selectedProduct.value.symbol,
  )
  const premiumRates = [1.032, 0.986, 1.074, 1.018, 0.957, 1.089]
  return Math.round(
    selectedProduct.value.unitPrice * premiumRates[productIndex % premiumRates.length],
  )
})

const orderBook = computed(() => {
  const base = marketPrice.value || selectedProduct.value?.unitPrice || 0

  return {
    asks: [3, 2, 1].map((step) => ({
      price: base + step * 120,
      quantity: step * 8 + 7,
      orders: step + 1,
    })),
    bids: [0, 1, 2].map((step) => ({
      price: base - step * 110,
      quantity: step * 10 + 11,
      orders: step + 2,
    })),
  }
})

const holdings = computed(() => {
  return tradableProducts.map((product, index) => {
    const quantity = [18, 11, 36, 27, 44][index % 5]
    const reservedQuantity = index % 2 === 0 ? 2 : 0
    const marketValue =
      Math.round(product.unitPrice * [1.032, 0.986, 1.074, 1.018, 0.957][index % 5])

    return {
      ...product,
      quantity,
      reservedQuantity,
      availableQuantity: quantity - reservedQuantity,
      marketPrice: marketValue,
    }
  })
})

const cash = computed(() => {
  const balance = 3500000
  const reserved = 420000

  return {
    balance,
    reserved,
    available: balance - reserved,
  }
})

const tokenCount = computed(() => {
  return holdings.value.reduce((sum, holding) => sum + holding.quantity, 0)
})

const tokenValue = computed(() => {
  return holdings.value.reduce(
    (sum, holding) => sum + holding.quantity * holding.marketPrice,
    0,
  )
})

const recentTrades = computed(() => {
  const sides = ['buy', 'sell', 'buy', 'buy', 'sell', 'sell']

  return sides.map((side, index) => ({
    side,
    symbol: selectedProduct.value?.symbol || '',
    price: marketPrice.value + (side === 'buy' ? index * 20 : -index * 18),
    quantity: [3, 7, 2, 12, 5, 9][index],
  }))
})

const reports = computed(() => {
  return [
    {
      id: 1048,
      side: 'buy',
      quantity: 6,
      filled: 4,
      message: '부분 체결',
    },
    {
      id: 1047,
      side: 'sell',
      quantity: 3,
      filled: 3,
      message: '전량 체결',
    },
    {
      id: 1046,
      side: 'buy',
      quantity: 10,
      filled: 0,
      message: '대기',
    },
  ]
})

const orderTotal = computed(() => {
  const price = selectedOrderType.value === 'market' ? marketPrice.value : orderPrice.value
  return Number(price || 0) * Number(orderQuantity.value || 0)
})

function syncOrderPrice() {
  orderPrice.value = marketPrice.value
}

function submitCashDeposit() {
  tradeMessage.value = `${formatWon(depositAmount.value)} 충전 요청이 준비되었습니다.`
}

function submitOrder() {
  const sideLabel = selectedSide.value === 'buy' ? '매수' : '매도'
  const typeLabel = selectedOrderType.value === 'limit' ? '지정가' : '시장가'
  tradeMessage.value = `${selectedProduct.value.name} ${sideLabel} ${orderQuantity.value}토큰 ${typeLabel} 주문이 준비되었습니다.`
}

watch(selectedProduct, syncOrderPrice, { immediate: true })
</script>

<template>
  <main class="market-page">
    <section class="page-hero">
      <p class="eyebrow">Secondary Market</p>
      <h1>보유 STO 토큰을 거래하세요</h1>
      <p>
        거래 가능 상품의 현재가, 호가창, 최근 체결을 확인하고 매수·매도 주문을
        준비할 수 있습니다.
      </p>
    </section>

    <section class="account">
      <div class="section-heading">
        <div>
          <p class="eyebrow">내 계좌</p>
          <h2>현금과 보유 STO 토큰</h2>
        </div>
      </div>
      <div class="account-grid">
        <article class="account-card">
          <span>사용 가능 현금</span>
          <strong>{{ formatWon(cash.available) }}</strong>
          <small>예약 {{ formatWon(cash.reserved) }}</small>
        </article>
        <article class="account-card">
          <span>보유 토큰 수</span>
          <strong>{{ tokenCount.toLocaleString('ko-KR') }}토큰</strong>
          <small>전체 거래 가능 상품 합산</small>
        </article>
        <article class="account-card">
          <span>토큰 평가액</span>
          <strong>{{ formatWon(tokenValue) }}</strong>
          <small>현재가 기준</small>
        </article>
      </div>

      <div class="account-table-wrap">
        <table class="account-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>보유</th>
              <th>거래 가능</th>
              <th>예약</th>
              <th>현재가</th>
              <th>평가액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="holding in holdings" :key="holding.symbol">
              <td>{{ holding.name }}</td>
              <td>{{ holding.quantity.toLocaleString('ko-KR') }}토큰</td>
              <td>{{ holding.availableQuantity.toLocaleString('ko-KR') }}토큰</td>
              <td>{{ holding.reservedQuantity.toLocaleString('ko-KR') }}토큰</td>
              <td>{{ formatWon(holding.marketPrice) }}</td>
              <td>{{ formatWon(holding.quantity * holding.marketPrice) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="market">
      <div class="section-heading">
        <div>
          <p class="eyebrow">2차 거래</p>
          <h2>STO 토큰 거래소</h2>
        </div>
      </div>

      <div class="market-layout">
        <aside class="market-sidebar">
          <h3>내 현금</h3>
          <div class="cash-card">
            <span>사용 가능</span>
            <strong>{{ formatWon(cash.available) }}</strong>
            <small>총 {{ formatWon(cash.balance) }} / 예약 {{ formatWon(cash.reserved) }}</small>
          </div>
          <form class="cash-form" @submit.prevent="submitCashDeposit">
            <label>
              충전 금액
              <input
                v-model.number="depositAmount"
                min="1000"
                step="1000"
                type="number"
              />
            </label>
            <button type="submit">현금 충전</button>
          </form>

          <h3>내 보유 토큰</h3>
          <div class="portfolio-list">
            <button
              v-for="holding in holdings"
              :key="holding.symbol"
              class="portfolio-item"
              :class="{ 'is-selected': selectedProduct?.symbol === holding.symbol }"
              type="button"
              @click="selectedSymbol = holding.symbol"
            >
              <strong>{{ holding.name }}</strong>
              <span>보유 {{ holding.quantity }}토큰</span>
              <small>
                거래가능 {{ holding.availableQuantity }} / 예약 {{ holding.reservedQuantity }}
              </small>
            </button>
          </div>
        </aside>

        <section class="market-board">
          <div class="market-toolbar">
            <label>
              거래 종목
              <select v-model="selectedSymbol">
                <option
                  v-for="product in tradableProducts"
                  :key="product.symbol"
                  :value="product.symbol"
                >
                  {{ product.name }}
                </option>
              </select>
            </label>
            <button type="button" @click="syncOrderPrice">새로고침</button>
          </div>

          <div class="market-grid">
            <div class="order-book-panel">
              <h3>호가창</h3>
              <div class="book-header">
                <span>가격</span>
                <span>수량</span>
                <span>주문</span>
              </div>
              <div class="order-book">
                <div
                  v-for="ask in orderBook.asks"
                  :key="`ask-${ask.price}`"
                  class="book-row is-ask"
                >
                  <span>{{ formatWon(ask.price) }}</span>
                  <strong>{{ ask.quantity }}</strong>
                  <span>{{ ask.orders }}</span>
                </div>
                <div
                  v-for="bid in orderBook.bids"
                  :key="`bid-${bid.price}`"
                  class="book-row is-bid"
                >
                  <span>{{ formatWon(bid.price) }}</span>
                  <strong>{{ bid.quantity }}</strong>
                  <span>{{ bid.orders }}</span>
                </div>
              </div>
            </div>

            <form class="trade-form" @submit.prevent="submitOrder">
              <h3>주문 넣기</h3>
              <div class="segmented" role="group" aria-label="매수 매도">
                <button
                  type="button"
                  :class="{ 'is-selected': selectedSide === 'buy' }"
                  @click="selectedSide = 'buy'"
                >
                  매수
                </button>
                <button
                  type="button"
                  :class="{ 'is-selected': selectedSide === 'sell' }"
                  @click="selectedSide = 'sell'"
                >
                  매도
                </button>
              </div>
              <div class="segmented" role="group" aria-label="주문 유형">
                <button
                  type="button"
                  :class="{ 'is-selected': selectedOrderType === 'limit' }"
                  @click="selectedOrderType = 'limit'"
                >
                  지정가
                </button>
                <button
                  type="button"
                  :class="{ 'is-selected': selectedOrderType === 'market' }"
                  @click="selectedOrderType = 'market'"
                >
                  시장가
                </button>
              </div>
              <label>
                가격
                <input
                  v-model.number="orderPrice"
                  :disabled="selectedOrderType === 'market'"
                  min="1"
                  step="1"
                  type="number"
                />
              </label>
              <label>
                수량
                <input v-model.number="orderQuantity" min="1" step="1" type="number" />
              </label>
              <dl class="order-summary compact">
                <div>
                  <dt>예상 주문금액</dt>
                  <dd>{{ formatWon(orderTotal) }}</dd>
                </div>
              </dl>
              <button type="submit">주문 제출</button>
              <p class="message" role="status">{{ tradeMessage }}</p>
            </form>
          </div>

          <div class="trade-history">
            <div>
              <h3>최근 체결</h3>
              <div class="trade-list">
                <div
                  v-for="trade in recentTrades"
                  :key="`${trade.side}-${trade.price}-${trade.quantity}`"
                  class="trade-row"
                  :class="trade.side === 'buy' ? 'is-bid' : 'is-ask'"
                >
                  <span>{{ trade.symbol }}</span>
                  <strong>{{ formatWon(trade.price) }}</strong>
                  <span>{{ trade.quantity }}토큰</span>
                </div>
              </div>
            </div>
            <div>
              <h3>주문 리포트</h3>
              <div class="trade-list">
                <div v-for="report in reports" :key="report.id" class="trade-row">
                  <span>#{{ report.id }}</span>
                  <strong>{{ report.side === 'buy' ? '매수' : '매도' }} {{ report.quantity }}토큰</strong>
                  <span>{{ report.message }} · 체결 {{ report.filled }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
