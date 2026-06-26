<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createInvestment,
  getInvestmentProduct,
  getInvestmentProducts,
} from '../api/investments'
import { createDepositRequest, getTossClientConfig } from '../api/payments'
import { getMyWallet } from '../api/wallets'
import { useAuth } from '../composables/useAuth'
import { products as mockProducts } from '../data/products'
import { formatHundredMillion, formatWon } from '../utils/formatters'

const emit = defineEmits(['navigate'])
const route = useRoute()
const { isAuthenticated, user } = useAuth()

const products = ref(mockProducts)
const wallet = ref(null)
const isLoadingProducts = ref(false)
const isLoadingWallet = ref(false)
const productMessage = ref('')
const walletMessage = ref('')
const investableProducts = computed(() => products.value.filter((product) => product.open))
const selectedSymbol = ref(getInitialSelectedSymbol())
const selectedPlanIndex = ref(1)
const widgets = ref(null)
const isPaymentReady = ref(false)
const isPreparingPayment = ref(false)
const isRequestingPayment = ref(false)
const paymentMessage = ref('')
const customerKey = createUuid()
const pendingInvestmentStorageKey = 'partionPendingInvestmentOrder'
const paymentReturnPathStorageKey = 'partionPaymentReturnPath'

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function getRouteProductId() {
  return getQueryValue(route.query.productId)
}

function getRouteProductSymbol() {
  return getQueryValue(route.query.symbol)
}

function hasProductId(product, productId) {
  const currentProductId = product?.productId ?? product?.id

  return (
    productId !== undefined &&
    productId !== null &&
    productId !== '' &&
    currentProductId !== undefined &&
    currentProductId !== null &&
    String(currentProductId) === String(productId)
  )
}

function findRouteProduct(productList) {
  const productId = getRouteProductId()
  const symbol = getRouteProductSymbol()

  return (
    productList.find((product) => hasProductId(product, productId)) ||
    productList.find((product) => symbol && product.symbol === symbol)
  )
}

function getFallbackSelectedSymbol(productList) {
  return productList.find((product) => product.open)?.symbol || productList[0]?.symbol
}

function getInitialSelectedSymbol() {
  return findRouteProduct(mockProducts)?.symbol || getFallbackSelectedSymbol(mockProducts)
}

function selectRouteProduct(productList) {
  const routeProduct = findRouteProduct(productList)

  if (!routeProduct) {
    return false
  }

  selectedSymbol.value = routeProduct.symbol
  return true
}

function selectFallbackProduct(productList) {
  if (productList.some((product) => product.symbol === selectedSymbol.value)) {
    return
  }

  selectedSymbol.value = getFallbackSelectedSymbol(productList)
}

const selectedProduct = computed(() => {
  return (
    products.value.find((product) => product.symbol === selectedSymbol.value) ||
    investableProducts.value[0] ||
    products.value[0]
  )
})

const progress = computed(() => {
  if (!selectedProduct.value) {
    return 0
  }

  return Math.min(
    100,
    Math.round(
      (selectedProduct.value.fundedAmount / selectedProduct.value.targetAmount) * 100,
    ),
  )
})

const plans = computed(() => {
  if (!selectedProduct.value) {
    return []
  }

  const tokens = selectedProduct.value.unitPrice >= 20000 ? [1, 3, 8] : [5, 15, 40]

  return [
    {
      label: '라이트',
      description: '첫 투자자에게 적합한 소액 플랜',
      tokens: tokens[0],
    },
    {
      label: '밸런스',
      description: '목표 수량을 안정적으로 확보하는 기본 플랜',
      tokens: tokens[1],
    },
    {
      label: '프라임',
      description: '모집 상품을 집중적으로 담는 고액 플랜',
      tokens: tokens[2],
    },
  ]
})

const selectedPlan = computed(() => plans.value[selectedPlanIndex.value] || plans.value[0])

const selectedAmount = computed(() => {
  if (!selectedProduct.value || !selectedPlan.value) {
    return 0
  }

  return selectedProduct.value.unitPrice * selectedPlan.value.tokens
})

const availableDepositBalance = computed(() => {
  return Number(wallet.value?.availableBalance ?? 0)
})

const usedDepositAmount = computed(() => {
  return Math.min(selectedAmount.value, availableDepositBalance.value)
})

const requiredDepositAmount = computed(() => {
  return Math.max(0, selectedAmount.value - availableDepositBalance.value)
})

const investmentActionLabel = computed(() => {
  if (isRequestingPayment.value) {
    return requiredDepositAmount.value > 0 ? '결제 요청 중' : '투자 처리 중'
  }

  if (!wallet.value) {
    return 'Toss로 충전 후 투자하기'
  }

  return requiredDepositAmount.value > 0
    ? '부족한 예치금 충전 후 투자하기'
    : '예치금으로 투자하기'
})

const projectedFundedAmount = computed(() => {
  if (!selectedProduct.value) {
    return 0
  }

  return Math.min(
    selectedProduct.value.targetAmount,
    selectedProduct.value.fundedAmount + selectedAmount.value,
  )
})

const projectedProgress = computed(() => {
  if (!selectedProduct.value) {
    return 0
  }

  return Math.min(
    100,
    Math.round((projectedFundedAmount.value / selectedProduct.value.targetAmount) * 100),
  )
})

const orderName = computed(() => {
  if (!selectedProduct.value || !selectedPlan.value) {
    return 'PARTION 투자 상품'
  }

  return `${selectedProduct.value.name} ${selectedPlan.value.label} ${selectedPlan.value.tokens}토큰`
})

const paymentStatusMessage = computed(() => {
  if (paymentMessage.value) {
    return paymentMessage.value
  }

  if (!isAuthenticated.value) {
    return '투자를 진행하려면 먼저 로그인하세요.'
  }

  if (isLoadingWallet.value) {
    return '지갑 예치금 정보를 확인하고 있습니다.'
  }

  if (isPreparingPayment.value) {
    return '결제 모듈을 준비하고 있습니다.'
  }

  if (wallet.value && requiredDepositAmount.value <= 0) {
    return '보유 예치금으로 바로 투자할 수 있습니다.'
  }

  if (wallet.value) {
    return isPaymentReady.value
      ? `${formatWon(usedDepositAmount.value)} 예치금을 사용하고 부족한 ${formatWon(requiredDepositAmount.value)}만 Toss로 충전합니다.`
      : '결제 모듈을 불러오는 중입니다.'
  }

  return walletMessage.value || '지갑 정보를 불러오지 못하면 Toss 결제로 진행합니다.'
})

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function getOrderId() {
  return `order_${createUuid().replaceAll('-', '').slice(0, 24)}`
}

function getPaymentReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}

function loadTossPaymentsScript() {
  if (globalThis.TossPayments) {
    return Promise.resolve(globalThis.TossPayments)
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('toss-payments-sdk')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(globalThis.TossPayments), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Toss 결제 모듈을 불러오지 못했습니다.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'toss-payments-sdk'
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    script.addEventListener('load', () => resolve(globalThis.TossPayments), { once: true })
    script.addEventListener('error', () => reject(new Error('Toss 결제 모듈을 불러오지 못했습니다.')), { once: true })
    document.head.appendChild(script)
  })
}

async function syncTossAmount() {
  if (!widgets.value || requiredDepositAmount.value <= 0) {
    return
  }

  await widgets.value.setAmount({
    value: requiredDepositAmount.value,
    currency: 'KRW',
  })
}

async function bootstrapPayment() {
  if (!selectedProduct.value || requiredDepositAmount.value <= 0) {
    return
  }

  isPreparingPayment.value = true
  isPaymentReady.value = false
  paymentMessage.value = ''

  try {
    await nextTick()
    const TossPayments = await loadTossPaymentsScript()
    const { clientKey } = await getTossClientConfig()
    const tossPayments = TossPayments(clientKey)

    widgets.value = tossPayments.widgets({ customerKey })
    await syncTossAmount()
    await Promise.all([
      widgets.value.renderPaymentMethods({
        selector: '#payment-methods',
        variantKey: 'DEFAULT',
      }),
      widgets.value.renderAgreement({
        selector: '#agreement',
        variantKey: 'AGREEMENT',
      }),
    ])
    isPaymentReady.value = true
  } catch (error) {
    paymentMessage.value = error.message || '결제 모듈을 준비하지 못했습니다.'
  } finally {
    isPreparingPayment.value = false
  }
}

watch(selectedSymbol, async () => {
  selectedPlanIndex.value = 1
  await loadSelectedProductDetail(selectedProduct.value?.productId)
  await syncTossAmount()
})

watch(selectedPlanIndex, syncTossAmount)

async function applyRouteSelection() {
  const productId = getRouteProductId()

  if (!selectRouteProduct(products.value) && productId) {
    await loadSelectedProductDetail(productId)
    selectRouteProduct(products.value)
  }

  selectFallbackProduct(products.value)
}

watch(
  () => [route.query.productId, route.query.symbol],
  async () => {
    await applyRouteSelection()
    await syncTossAmount()
  },
)

async function loadInvestableProducts() {
  isLoadingProducts.value = true
  productMessage.value = ''

  try {
    const page = await getInvestmentProducts({ page: 0, size: 20 })

    if (page.content.length) {
      products.value = page.content
      await applyRouteSelection()
    }
  } catch (error) {
    productMessage.value = `${error.message || '상품 API를 불러오지 못했습니다.'} 현재는 예시 데이터로 표시합니다.`
  } finally {
    isLoadingProducts.value = false
  }
}

async function loadSelectedProductDetail(productId) {
  if (!productId) {
    return
  }

  try {
    const product = await getInvestmentProduct(productId)
    if (!product) {
      return
    }

    const index = products.value.findIndex((item) => item.productId === product.productId)
    if (index >= 0) {
      products.value.splice(index, 1, {
        ...products.value[index],
        ...product,
      })
      return
    }

    products.value.unshift(product)
  } catch (error) {
    productMessage.value = `${error.message || '상품 상세 API를 불러오지 못했습니다.'} 필요한 값은 예시 데이터로 보강합니다.`
  }
}

async function loadWallet() {
  if (!isAuthenticated.value) {
    wallet.value = null
    walletMessage.value = ''
    return
  }

  isLoadingWallet.value = true
  walletMessage.value = ''

  try {
    wallet.value = await getMyWallet()
  } catch (error) {
    wallet.value = null
    walletMessage.value = `${error.message || '지갑 API를 불러오지 못했습니다.'} 결제는 Toss 충전 흐름으로 진행합니다.`
  } finally {
    isLoadingWallet.value = false
  }
}

function applyInvestmentResult(investment) {
  const requestedQuantity = Number(investment?.requestedQuantity ?? selectedPlan.value?.tokens ?? 0)
  const quantity = Number(investment?.investedQuantity ?? investment?.quantity ?? selectedPlan.value?.tokens ?? 0)
  const unfilledQuantity = Number(
    investment?.unfilledQuantity ?? Math.max(0, requestedQuantity - quantity),
  )
  const amount = Number(investment?.totalAmount ?? investment?.amount ?? selectedAmount.value)
  const leftoverAmount = Number(
    investment?.leftoverAmount ?? Math.max(0, selectedAmount.value - amount),
  )

  if (selectedProduct.value && amount > 0) {
    selectedProduct.value.fundedAmount = Math.min(
      selectedProduct.value.targetAmount,
      selectedProduct.value.fundedAmount + amount,
    )
    selectedProduct.value.currentAmount = selectedProduct.value.fundedAmount
  }

  if (wallet.value && amount > 0) {
    wallet.value.availableBalance = Math.max(0, wallet.value.availableBalance - amount)
    wallet.value.totalBalance = Math.max(0, wallet.value.totalBalance - amount)
  }

  paymentMessage.value = unfilledQuantity > 0
    ? `${quantity}토큰만 투자되었습니다. 남은 ${unfilledQuantity}토큰에 해당하는 ${formatWon(leftoverAmount)}은 예치금으로 보관됩니다.`
    : `${quantity}토큰 투자가 완료되었습니다.`
}

async function handlePaymentClick() {
  if (!isAuthenticated.value) {
    paymentMessage.value = '로그인 후 투자 결제를 진행할 수 있습니다.'
    emit('navigate', 'login')
    return
  }

  if (!selectedProduct.value || !selectedProduct.value.open) {
    paymentMessage.value = '현재 투자 가능한 상품을 선택해주세요.'
    return
  }

  isRequestingPayment.value = true
  paymentMessage.value = ''

  try {
    if (requiredDepositAmount.value <= 0) {
      const investment = await createInvestment({
        productId: selectedProduct.value.productId,
        quantity: selectedPlan.value.tokens,
      })
      applyInvestmentResult(investment)
      return
    }

    if (!widgets.value || !isPaymentReady.value) {
      await bootstrapPayment()
    }
    if (!widgets.value) {
      throw new Error('결제 모듈을 준비하지 못했습니다.')
    }

    const deposit = await createDepositRequest({
      amount: requiredDepositAmount.value,
    })
    const orderId = deposit.orderId || getOrderId()
    const returnPath = getPaymentReturnPath()

    globalThis.sessionStorage.setItem(paymentReturnPathStorageKey, returnPath)

    globalThis.sessionStorage.setItem(pendingInvestmentStorageKey, JSON.stringify({
      orderId,
      amount: requiredDepositAmount.value,
      productId: selectedProduct.value.productId,
      quantity: selectedPlan.value.tokens,
      orderName: orderName.value,
      returnPath,
    }))

    await widgets.value.requestPayment({
      orderId,
      orderName: orderName.value,
      customerName: user.value?.nickname || user.value?.name || 'PARTION 회원',
      customerEmail: user.value?.email || 'customer@example.com',
      successUrl: `${window.location.origin}/payment/success?returnTo=${encodeURIComponent(returnPath)}`,
      failUrl: `${window.location.origin}/payment/fail?returnTo=${encodeURIComponent(returnPath)}`,
    })
  } catch (error) {
    paymentMessage.value = error.message || '결제를 시작하지 못했습니다.'
  } finally {
    isRequestingPayment.value = false
  }
}

onMounted(async () => {
  await loadInvestableProducts()
  await loadWallet()
  await loadSelectedProductDetail(selectedProduct.value?.productId)
  await bootstrapPayment()
})
</script>

<template>
  <main class="invest-page">
    <section class="page-hero invest-hero">
      <div>
        <p class="eyebrow">Invest</p>
        <h1>모집 중인 상품에 투자하세요</h1>
        <p>
          부동산, 미술품 상품의 모집 현황과 투자 단가를 확인하고 원하는 수량을
          선택해 투자 주문을 준비할 수 있습니다.
        </p>
      </div>
      <button type="button" class="secondary-link" @click="emit('navigate', 'products')">
        상품 목록으로 이동
      </button>
    </section>

    <section class="invest-layout">
      <aside class="product-picker">
        <div class="panel-heading">
          <p class="eyebrow">Open Products</p>
          <h2>투자 상품</h2>
        </div>
        <div class="portfolio-list" aria-label="투자 상품 선택">
          <p v-if="isLoadingProducts" class="message">상품 목록을 불러오는 중입니다.</p>
          <p v-else-if="productMessage" class="message">{{ productMessage }}</p>
          <button
            v-for="product in investableProducts"
            :key="product.symbol"
            class="portfolio-item"
            :class="{ 'is-selected': selectedProduct?.symbol === product.symbol }"
            type="button"
            @click="selectedSymbol = product.symbol"
          >
            <strong>{{ product.name }}</strong>
            <span>{{ product.category }} · {{ product.statusLabel || product.status }}</span>
            <small>
              {{ formatHundredMillion(product.fundedAmount) }} /
              {{ formatHundredMillion(product.targetAmount) }}
            </small>
          </button>
        </div>
      </aside>

      <section v-if="selectedProduct" class="invest-checkout">
        <article class="selection">
          <div
            class="checkout-media"
            :style="{ backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0), rgba(17, 24, 39, 0.24)), url(${selectedProduct.imageUrl})` }"
            aria-hidden="true"
          ></div>
          <span class="badge">
            {{ selectedProduct.category }} · {{ selectedProduct.statusLabel || selectedProduct.status }}
          </span>
          <div class="panel-heading">
            <p class="eyebrow">투자 정보</p>
            <h2>{{ selectedProduct.name }}</h2>
          </div>
          <p class="detail-copy">{{ selectedProduct.summary }}</p>

          <div class="recruitment-meter" aria-label="목표 투자금 달성률">
            <div class="meter-head">
              <span>목표 투자금 달성률</span>
              <strong>{{ progress }}%</strong>
            </div>
            <div class="progress-track">
              <span :style="{ width: `${progress}%` }"></span>
            </div>
            <small>
              {{ formatHundredMillion(selectedProduct.fundedAmount) }} /
              {{ formatHundredMillion(selectedProduct.targetAmount) }}
            </small>
          </div>

          <div class="plans" role="radiogroup" aria-label="투자 금액 선택">
            <button
              v-for="(plan, index) in plans"
              :key="plan.label"
              class="plan"
              :class="{ 'is-selected': selectedPlanIndex === index }"
              type="button"
              role="radio"
              :aria-checked="selectedPlanIndex === index"
              @click="selectedPlanIndex = index"
            >
              <span>{{ plan.label }}</span>
              <strong>{{ formatWon(selectedProduct.unitPrice * plan.tokens) }}</strong>
              <small>{{ plan.tokens }}토큰 · {{ plan.description }}</small>
            </button>
          </div>
        </article>

        <aside class="payment-panel">
          <div class="panel-heading">
            <p class="eyebrow">Order</p>
            <h2>투자 주문</h2>
          </div>
          <dl class="order-summary">
            <div>
              <dt>선택 상품</dt>
              <dd>{{ selectedProduct.name }}</dd>
            </div>
            <div>
              <dt>투자 수량</dt>
              <dd>{{ selectedPlan?.tokens }}토큰</dd>
            </div>
            <div>
              <dt>투자 금액</dt>
              <dd>
                <strong>{{ formatWon(selectedAmount) }}</strong>
              </dd>
            </div>
            <div>
              <dt>예상 달성률</dt>
              <dd>{{ projectedProgress }}%</dd>
            </div>
            <div v-if="isAuthenticated">
              <dt>사용 가능 예치금</dt>
              <dd>{{ wallet ? formatWon(availableDepositBalance) : '-' }}</dd>
            </div>
            <div v-if="isAuthenticated && wallet">
              <dt>사용할 예치금</dt>
              <dd>{{ formatWon(usedDepositAmount) }}</dd>
            </div>
            <div v-if="isAuthenticated && wallet">
              <dt>추가 충전 금액</dt>
              <dd>{{ formatWon(requiredDepositAmount) }}</dd>
            </div>
          </dl>
          <div class="payment-action-area">
            <div
              v-if="requiredDepositAmount > 0"
              class="toss-widget-box"
              aria-label="Toss 결제 선택 영역"
            >
              <div id="payment-methods"></div>
              <div id="agreement"></div>
            </div>
            <button
              class="investment-action-button"
              type="button"
              :disabled="isPreparingPayment || isRequestingPayment || !selectedProduct.open"
              @click="handlePaymentClick"
            >
              {{ investmentActionLabel }}
            </button>
            <p class="payment-status-message" role="status">{{ paymentStatusMessage }}</p>
          </div>
        </aside>
      </section>
    </section>
  </main>
</template>
