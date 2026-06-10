<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getProducts } from '../api/products'
import { products as mockProducts } from '../data/products'
import { formatHundredMillion, formatWon } from '../utils/formatters'

const emit = defineEmits(['navigate'])

const products = ref(mockProducts)
const isLoadingProducts = ref(false)
const productMessage = ref('')
const investableProducts = computed(() => products.value.filter((product) => product.open))
const selectedSymbol = ref(mockProducts.find((product) => product.open)?.symbol || mockProducts[0]?.symbol)
const selectedPlanIndex = ref(1)

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

watch(selectedSymbol, () => {
  selectedPlanIndex.value = 1
})

async function loadInvestableProducts() {
  isLoadingProducts.value = true
  productMessage.value = ''

  try {
    const page = await getProducts({ status: 'FUNDING', page: 0, size: 20 })

    if (page.content.length) {
      products.value = page.content
      selectedSymbol.value = page.content.find((product) => product.open)?.symbol || page.content[0]?.symbol
    }
  } catch (error) {
    productMessage.value = `${error.message || '상품 API를 불러오지 못했습니다.'} 현재는 예시 데이터로 표시합니다.`
  } finally {
    isLoadingProducts.value = false
  }
}

onMounted(loadInvestableProducts)
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
              <dt>결제 금액</dt>
              <dd>
                <strong>{{ formatWon(selectedAmount) }}</strong>
              </dd>
            </div>
            <div>
              <dt>예상 달성률</dt>
              <dd>{{ projectedProgress }}%</dd>
            </div>
          </dl>
          <div class="payment-placeholder">
            <strong>결제 모듈 준비 영역</strong>
            <span>API 연동 전까지 화면 흐름만 확인할 수 있습니다.</span>
          </div>
          <button type="button">투자 결제하기</button>
          <p class="message" role="status">투자를 진행하려면 먼저 로그인하세요.</p>
        </aside>
      </section>
    </section>
  </main>
</template>
